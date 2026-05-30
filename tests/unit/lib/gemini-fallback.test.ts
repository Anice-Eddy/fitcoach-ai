import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.GEMINI_API_KEY = 'test-key'
process.env.GROQ_API_KEY   = 'test-key-groq'

import { AIProviderService } from '@/lib/ai/provider-service'

const geminiOk = (text: string) => ({
  ok:   true,
  text: async () => '',
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
})

const geminiErr = (status: number) => ({
  ok:     false,
  status,
  text:   async () => `Error ${status}`,
})

const groqOk = (text: string) => ({
  ok:   true,
  text: async () => '',
  json: async () => ({ choices: [{ message: { content: text } }] }),
})

describe('AIProviderService — fallback chain Gemini', () => {
  let service: AIProviderService

  beforeEach(() => {
    // Each test gets a fresh service with no cooldowns
    service = new AIProviderService()
    service.resetCooldowns()
    vi.restoreAllMocks()
  })

  it('utilise gemini-2.5-pro en premier', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(geminiOk('Réponse pro')))
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.provider).toBe('GEMINI')
    expect(result.text).toBe('Réponse pro')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('gemini-2.5-pro')
  })

  it('bascule sur gemini-2.5-flash si pro échoue (429)', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro → quota
      .mockResolvedValueOnce(geminiOk('Réponse flash')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.text).toBe('Réponse flash')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain('gemini-2.5-flash')
  })

  it('bascule sur flash-lite si pro et flash échouent', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro → quota
      .mockResolvedValueOnce(geminiErr(503))            // flash → unavailable
      .mockResolvedValueOnce(geminiOk('Réponse lite')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.text).toBe('Réponse lite')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[2][0]).toContain('gemini-2.5-flash-lite')
  })

  it('bascule sur Groq si tous les modèles Gemini échouent', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro
      .mockResolvedValueOnce(geminiErr(503))            // flash
      .mockResolvedValueOnce(geminiErr(500))            // lite
      .mockResolvedValueOnce(groqOk('Réponse Groq')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.provider).toBe('GROQ')
    expect(result.text).toBe('Réponse Groq')
  })

  it('lève une erreur si tous les providers échouent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiErr(500)))
    await expect(service.generate([{ role: 'user', content: 'test' }])).rejects.toThrow()
  })

  it('force Groq si preferredProvider=GROQ (sans essayer Gemini)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(groqOk('Réponse Groq directe')))
    const result = await service.generate([{ role: 'user', content: 'test' }], 'GROQ')
    expect(result.provider).toBe('GROQ')
    expect(result.text).toBe('Réponse Groq directe')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('groq.com')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
