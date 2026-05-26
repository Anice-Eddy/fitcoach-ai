import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIProviderService } from '@/lib/ai/provider-service'

const originalEnv = process.env

describe('AIProviderService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  it('utilise Gemini en priorité', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY = 'groq-key'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Réponse Gemini' }] } }],
      }),
    }))

    const result = await new AIProviderService().generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GEMINI', text: 'Réponse Gemini' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('fallback automatiquement vers Groq si Gemini échoue', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY = 'groq-key'

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Réponse Groq' } }] }),
      }))

    const result = await new AIProviderService().generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GROQ', text: 'Réponse Groq' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('renvoie une erreur propre si aucun provider n’est configuré', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GROQ_API_KEY

    await expect(new AIProviderService().generate([{ role: 'user', content: 'Salut' }]))
      .rejects
      .toThrow('Aucun provider IA configuré')
  })
})
