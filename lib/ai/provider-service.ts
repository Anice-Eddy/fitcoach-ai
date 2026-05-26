import type { AIMessageInput, AIProviderResult } from '@/lib/ai/types'

const GEMINI_MODEL = 'gemini-1.5-flash'
const GROQ_MODEL = 'llama-3.1-8b-instant'

export class AIProviderService {
  async generate(messages: AIMessageInput[]): Promise<AIProviderResult> {
    const errors: string[] = []

    if (process.env.GEMINI_API_KEY) {
      try {
        const text = await this.generateWithGemini(messages)
        return { provider: 'GEMINI', text }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur Gemini inconnue'
        console.error('[ai] Gemini provider failed:', message)
        errors.push(`Gemini: ${message}`)
      }
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const text = await this.generateWithGroq(messages)
        return { provider: 'GROQ', text }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur Groq inconnue'
        console.error('[ai] Groq provider failed:', message)
        errors.push(`Groq: ${message}`)
      }
    }

    throw new Error(errors.length > 0 ? errors.join(' | ') : 'Aucun provider IA configuré')
  }

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

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join('\n')
    if (!text) throw new Error('Réponse Gemini vide')
    return text
  }

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

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error('Réponse Groq vide')
    return text
  }
}
