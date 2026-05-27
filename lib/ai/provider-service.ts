import type { AIMessageInput, AIProviderResult } from '@/lib/ai/types'

const GEMINI_MODEL = 'gemini-2.5-flash'
// llama-3.3-70b-versatile supports 128k context vs 8k for llama-3.1-8b-instant — avoids HTTP 413 on large fitness contexts
const GROQ_MODEL   = 'llama-3.3-70b-versatile'

// Module-level cooldown map — survives request boundaries within the same Node process.
// Keys: 'gemini' | 'groq'  Values: timestamp (ms) until which the provider is skipped.
const cooldownUntil = new Map<string, number>()

// Returns true if the provider key is currently within a cooldown window.
function onCooldown(key: string): boolean {
  const t = cooldownUntil.get(key)
  return t !== undefined && Date.now() < t
}

// Sets a cooldown for the given provider key for the specified number of milliseconds.
function setCooldown(key: string, ms: number) {
  cooldownUntil.set(key, Date.now() + ms)
}

/** Calls AI providers with automatic fallback and per-provider cooldown management. */
export class AIProviderService {
  /** Generates AI text using Gemini first, falling back to Groq; respects per-provider cooldowns. */
  async generate(messages: AIMessageInput[], preferredProvider?: 'GEMINI' | 'GROQ'): Promise<AIProviderResult> {
    const errors: string[] = []
    const tryGemini = !preferredProvider || preferredProvider === 'GEMINI'
    const tryGroq   = !preferredProvider || preferredProvider === 'GROQ'

    if (tryGemini && process.env.GEMINI_API_KEY) {
      if (onCooldown('gemini')) {
        errors.push('Gemini: rate-limited (cooldown)')
      } else {
        try {
          const text = await this.generateWithGemini(messages)
          return { provider: 'GEMINI', text }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur Gemini inconnue'
          console.error('[ai] Gemini provider failed:', message)
          if (message.includes('429'))      setCooldown('gemini', 60_000)
          else if (message.includes('503')) setCooldown('gemini', 30_000)
          else if (message.includes('404')) setCooldown('gemini', 90_000)
          else if (message.includes('500')) setCooldown('gemini', 30_000)
          errors.push(`Gemini: ${message}`)
        }
      }
    }

    if (tryGroq && process.env.GROQ_API_KEY) {
      if (onCooldown('groq')) {
        errors.push('Groq: rate-limited (cooldown)')
      } else {
        try {
          const text = await this.generateWithGroq(messages)
          return { provider: 'GROQ', text }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Erreur Groq inconnue'
          console.error('[ai] Groq provider failed:', message)
          if (message.includes('429'))      setCooldown('groq', 30_000)
          else if (message.includes('503')) setCooldown('groq', 20_000)
          else if (message.includes('500')) setCooldown('groq', 30_000)
          // 413 = payload too large — no cooldown, fix is in the request size not the provider
          errors.push(`Groq: ${message}`)
        }
      }
    }

    throw new Error(errors.length > 0 ? errors.join(' | ') : 'Aucun provider IA configuré')
  }

  // Sends messages to the Gemini REST API and returns the generated text; throws on HTTP errors or empty responses.
  private async generateWithGemini(messages: AIMessageInput[]) {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n')
    const content = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'assistant' ? 'Assistant' : 'Utilisateur'}: ${m.content}`)
      .join('\n\n')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: content }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 1600 },
        }),
      },
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`)
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join('\n')
    if (!text) throw new Error('Réponse Gemini vide')
    return text
  }

  // Sends messages to the Groq OpenAI-compatible API and returns the generated text; throws on HTTP errors or empty responses.
  private async generateWithGroq(messages: AIMessageInput[]) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.35,
        max_tokens:  1600,
        messages,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ''}`)
    }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error('Réponse Groq vide')
    return text
  }
}
