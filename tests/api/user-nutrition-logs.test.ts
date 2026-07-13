import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    nutritionLog: {
      findMany:   vi.fn(),
      upsert:     vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { DELETE, GET, POST } from '@/app/api/user/nutrition/logs/route'

const session = { user: { id: 'user-1' } }

function request(method: string, body?: unknown, search = '') {
  return new Request(`http://localhost/api/user/nutrition/logs${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('/api/user/nutrition/logs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(session)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await GET(request('GET'))
    expect(res.status).toBe(401)
  })

  it('returns daily logs with totals', async () => {
    ;(prisma.nutritionLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { calories: 500, proteinG: 40, carbsG: 55, fatG: 12, loggedAt: new Date() },
      { calories: 300, proteinG: 20, carbsG: 30, fatG: 8, loggedAt: new Date() },
    ])

    const res = await GET(request('GET', undefined, '?date=2026-06-02'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.totals).toEqual({ calories: 800, proteinG: 60, carbsG: 85, fatG: 20 })
    expect((prisma.nutritionLog.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0].where)
      .toEqual({ userId: 'user-1', date: '2026-06-02' })
  })

  it('returns 422 when the log is invalid', async () => {
    const res = await POST(request('POST', { clientKey: '', calories: -1 }))
    expect(res.status).toBe(422)
  })

  it('upserts a consumed meal to avoid duplicates', async () => {
    ;(prisma.nutritionLog.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'log-1' })

    const res = await POST(request('POST', {
      date:      '2026-06-02',
      clientKey: 'meal:m1',
      mealType:  'LUNCH',
      name:      'Déjeuner',
      calories:  650,
      proteinG:  45,
      carbsG:    70,
      fatG:      18,
    }))

    expect(res.status).toBe(201)
    const call = (prisma.nutritionLog.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.where.userId_date_clientKey).toEqual({ userId: 'user-1', date: '2026-06-02', clientKey: 'meal:m1' })
    expect(call.create.userId).toBe('user-1')
  })

  it('deletes the meal when it is unchecked', async () => {
    ;(prisma.nutritionLog.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })

    const res = await DELETE(request('DELETE', { date: '2026-06-02', clientKey: 'meal:m1' }))

    expect(res.status).toBe(200)
    expect((prisma.nutritionLog.deleteMany as ReturnType<typeof vi.fn>).mock.calls[0][0].where)
      .toEqual({ userId: 'user-1', date: '2026-06-02', clientKey: 'meal:m1' })
  })
})
