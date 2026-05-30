import type { AIMessageInput, AIProviderResult } from '@/lib/ai/types'
import type { AITool } from '@/lib/ai/tools'

// Gemini model fallback chain: premium → standard → lite
const GEMINI_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const

type GeminiModelId = typeof GEMINI_MODELS[number]

// llama-3.3-70b-versatile supports 128k context — avoids HTTP 413 on large fitness contexts
const GROQ_MODEL   = 'llama-3.3-70b-versatile'
const MAX_TOOL_CALLS = 3

// Module-level cooldown map — shared across all instances, persists across requests in the same process
const _cooldownUntil = new Map<string, number>()

// Gemini multi-turn content format
interface GeminiPart {
  text?: string
  functionCall?: { name: string; args: Record<string, unknown> }
  functionResponse?: { name: string; response: unknown }
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

/** Converts AIMessageInput[] (excluding system) to Gemini multi-turn contents format. */
function toGeminiContents(messages: AIMessageInput[]): GeminiContent[] {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role:  (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }],
    }))
}

/** Calls AI providers with automatic fallback: Gemini 2.5-pro → 2.5-flash → 2.5-flash-lite → Groq. */
export class AIProviderService {
  /** Instance-level cooldowns — isolated per instance so tests can reset by creating a new instance. */
  private cooldowns = _cooldownUntil

  private onCooldown(key: string): boolean {
    const t = this.cooldowns.get(key)
    return t !== undefined && Date.now() < t
  }

  private setCooldown(key: string, ms: number) {
    this.cooldowns.set(key, Date.now() + ms)
  }

  /** Clears all provider cooldowns (useful in tests). */
  resetCooldowns() {
    this.cooldowns = new Map()
  }

  /** Generates AI text, with optional Gemini function calling (budget: 3 tool calls max). */
  async generate(
    messages:           AIMessageInput[],
    preferredProvider?: 'GEMINI' | 'GROQ',
    tools?:             AITool[],
  ): Promise<AIProviderResult> {
    const errors: string[] = []
    const tryGemini = !preferredProvider || preferredProvider === 'GEMINI'
    const tryGroq   = !preferredProvider || preferredProvider === 'GROQ'

    if (tryGemini && process.env.GEMINI_API_KEY) {
      for (const model of GEMINI_MODELS) {
        const key = `gemini:${model}`
        if (this.onCooldown(key)) { errors.push(`${model}: cooldown`); continue }
        try {
          const text = await this.generateWithGemini(messages, model, tools)
          return { provider: 'GEMINI', text }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erreur inconnue'
          console.error(`[ai] Gemini (${model}) failed:`, msg)
          if (msg.includes('429'))      this.setCooldown(key, 60_000)
          else if (msg.includes('503')) this.setCooldown(key, 30_000)
          else if (msg.includes('404')) this.setCooldown(key, 90_000)
          else if (msg.includes('500')) this.setCooldown(key, 30_000)
          errors.push(`${model}: ${msg}`)
        }
      }
    }

    if (tryGroq && process.env.GROQ_API_KEY) {
      if (this.onCooldown('groq')) {
        errors.push('Groq: cooldown')
      } else {
        try {
          const text = await this.generateWithGroq(messages)
          return { provider: 'GROQ', text }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erreur inconnue'
          console.error('[ai] Groq failed:', msg)
          if (msg.includes('429'))      this.setCooldown('groq', 30_000)
          else if (msg.includes('503')) this.setCooldown('groq', 20_000)
          else if (msg.includes('500')) this.setCooldown('groq', 30_000)
          errors.push(`Groq: ${msg}`)
        }
      }
    }

    throw new Error(errors.length > 0 ? errors.join(' | ') : 'Aucun provider IA configuré')
  }

  /** Calls one Gemini model with optional function calling loop (budget: MAX_TOOL_CALLS). */
  private async generateWithGemini(
    messages: AIMessageInput[],
    model:    GeminiModelId,
    tools?:   AITool[],
  ): Promise<string> {
    const system = messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n\n')

    const contents: GeminiContent[] = toGeminiContents(messages)
    let toolCallsUsed = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const body: Record<string, unknown> = {
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: 0.35, maxOutputTokens: 1600 },
      }

      if (tools?.length && toolCallsUsed < MAX_TOOL_CALLS) {
        body.tools = [{
          functionDeclarations: tools.map(t => ({
            name:        t.name,
            description: t.description,
            parameters:  t.parameters,
          })),
        }]
        body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } }
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      )

      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}${raw ? `: ${raw.slice(0, 120)}` : ''}`)
      }

      const data = await res.json()
      const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? []
      const fnCall = parts.find(p => p.functionCall)

      if (fnCall?.functionCall && toolCallsUsed < MAX_TOOL_CALLS) {
        const { name, args } = fnCall.functionCall
        const tool   = tools?.find(t => t.name === name)
        const result = tool
          ? await tool.handler(args ?? {}).catch((e: unknown) => ({ error: String(e) }))
          : { error: `Outil inconnu: ${name}` }

        contents.push({ role: 'model', parts: [{ functionCall: { name, args: args ?? {} } }] })
        contents.push({ role: 'user',  parts: [{ functionResponse: { name, response: result } }] })
        toolCallsUsed++
        continue
      }

      const text = parts.filter(p => p.text).map(p => p.text).join('\n').trim()
      if (!text) throw new Error('Réponse Gemini vide')
      return text
    }
  }

  /** Calls Groq (OpenAI-compatible API) and returns the generated text. */
  private async generateWithGroq(messages: AIMessageInput[]): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.35, max_tokens: 1600, messages }),
    })

    if (!res.ok) {
      const raw = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}${raw ? `: ${raw.slice(0, 120)}` : ''}`)
    }
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content
    if (!text) throw new Error('Réponse Groq vide')
    return text
  }
}
