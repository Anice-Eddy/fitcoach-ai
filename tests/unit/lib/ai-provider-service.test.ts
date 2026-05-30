import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIProviderService } from '@/lib/ai/provider-service'

const originalEnv = process.env

const geminiSuccess = {
  ok:   true,
  text: async () => '',
  json: async () => ({ candidates: [{ content: { parts: [{ text: 'Réponse Gemini' }] } }] }),
}

const geminiError = {
  ok:   false,
  status: 500,
  text: async () => 'Internal Server Error',
}

const groqSuccess = {
  ok:   true,
  text: async () => '',
  json: async () => ({ choices: [{ message: { content: 'Réponse Groq' } }] }),
}

describe('AIProviderService', () => {
  let service: AIProviderService

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    service = new AIProviderService()
    service.resetCooldowns()
  })

  it('utilise Gemini (2.5-pro) en priorité', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY  = 'groq-key'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiSuccess))

    const result = await service.generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GEMINI', text: 'Réponse Gemini' })
    expect(fetch).toHaveBeenCalledTimes(1)
    // Must use the pro model first
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('gemini-2.5-pro')
  })

  it('fallback automatiquement vers Groq si tous les modèles Gemini échouent', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY  = 'groq-key'

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiError)  // pro fails
      .mockResolvedValueOnce(geminiError)  // flash fails
      .mockResolvedValueOnce(geminiError)  // lite fails
      .mockResolvedValueOnce(groqSuccess), // Groq succeeds
    )

    const result = await service.generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GROQ', text: 'Réponse Groq' })
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('renvoie une erreur propre si aucun provider n\'est configuré', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GROQ_API_KEY

    await expect(service.generate([{ role: 'user', content: 'Salut' }]))
      .rejects.toThrow('Aucun provider IA configuré')
  })
})
