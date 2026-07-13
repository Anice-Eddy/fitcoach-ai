import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIProviderService } from '@/lib/ai/provider-service'

const originalEnv = process.env

const geminiSuccess = {
  ok:   true,
  text: async () => '',
  json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }] }),
}

const geminiError = {
  ok:   false,
  status: 500,
  text: async () => 'Internal Server Error',
}

const groqSuccess = {
  ok:   true,
  text: async () => '',
  json: async () => ({ choices: [{ message: { content: 'Groq response' } }] }),
}

describe('AIProviderService', () => {
  let service: AIProviderService

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    service = new AIProviderService()
    service.resetCooldowns()
  })

  it('uses Gemini 2.5 Pro first', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY  = 'groq-key'

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiSuccess))

    const result = await service.generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GEMINI', text: 'Gemini response' })
    expect(fetch).toHaveBeenCalledTimes(1)
    // Must use the pro model first
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('gemini-2.5-pro')
  })

  it('automatically falls back to Groq when all Gemini models fail', async () => {
    process.env.GEMINI_API_KEY = 'gemini-key'
    process.env.GROQ_API_KEY  = 'groq-key'

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiError)  // pro fails
      .mockResolvedValueOnce(geminiError)  // flash fails
      .mockResolvedValueOnce(geminiError)  // lite fails
      .mockResolvedValueOnce(groqSuccess), // Groq succeeds
    )

    const result = await service.generate([{ role: 'user', content: 'Salut' }])

    expect(result).toEqual({ provider: 'GROQ', text: 'Groq response' })
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('returns a clean error when no provider is configured', async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GROQ_API_KEY

    await expect(service.generate([{ role: 'user', content: 'Salut' }]))
      .rejects.toThrow('No AI provider configured')
  })
})
