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

  it('uses gemini-2.5-pro first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(geminiOk('Pro response')))
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.provider).toBe('GEMINI')
    expect(result.text).toBe('Pro response')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('gemini-2.5-pro')
  })

  it('falls back to gemini-2.5-flash when pro fails with 429', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro → quota
      .mockResolvedValueOnce(geminiOk('Flash response')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.text).toBe('Flash response')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[1][0]).toContain('gemini-2.5-flash')
  })

  it('falls back to flash-lite when pro and flash fail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro → quota
      .mockResolvedValueOnce(geminiErr(503))            // flash → unavailable
      .mockResolvedValueOnce(geminiOk('Lite response')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.text).toBe('Lite response')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[2][0]).toContain('gemini-2.5-flash-lite')
  })

  it('falls back to Groq when all Gemini models fail', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(geminiErr(429))            // pro
      .mockResolvedValueOnce(geminiErr(503))            // flash
      .mockResolvedValueOnce(geminiErr(500))            // lite
      .mockResolvedValueOnce(groqOk('Groq response')),
    )
    const result = await service.generate([{ role: 'user', content: 'test' }])
    expect(result.provider).toBe('GROQ')
    expect(result.text).toBe('Groq response')
  })

  it('throws when all providers fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiErr(500)))
    await expect(service.generate([{ role: 'user', content: 'test' }])).rejects.toThrow()
  })

  it('forces Groq when preferredProvider=GROQ without trying Gemini', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(groqOk('Direct Groq response')))
    const result = await service.generate([{ role: 'user', content: 'test' }], 'GROQ')
    expect(result.provider).toBe('GROQ')
    expect(result.text).toBe('Direct Groq response')
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('groq.com')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
