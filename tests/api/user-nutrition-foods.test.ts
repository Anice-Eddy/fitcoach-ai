import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    foodLibraryItem: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET, POST } from '@/app/api/user/nutrition/foods/route'
import { DELETE } from '@/app/api/user/nutrition/foods/[foodId]/route'

const session = { user: { id: 'user-1' } }

function request(method: string, body?: unknown, path = '/api/user/nutrition/foods') {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function food(overrides: Record<string, unknown> = {}) {
  return {
    id:              'food-1',
    createdByUserId: 'user-1',
    name:            'Riz maison',
    brand:           null,
    category:        'carb',
    visibility:      'PUBLIC',
    source:          'USER',
    caloriesPer100g: 130,
    proteinPer100g:  2.7,
    carbsPer100g:    28,
    fatPer100g:      0.3,
    fiberPer100g:    0.4,
    sugarPer100g:    null,
    createdAt:       new Date('2026-06-25T10:00:00.000Z'),
    updatedAt:       new Date('2026-06-25T10:00:00.000Z'),
    ...overrides,
  }
}

describe('/api/user/nutrition/foods', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(session)
  })

  it('retourne les aliments publics et indique ceux supprimables par le créateur', async () => {
    ;(prisma.foodLibraryItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      food(),
      food({ id: 'food-2', createdByUserId: 'other-user', name: 'Poulet partagé' }),
    ])

    const res = await GET(request('GET'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.foods[0].canDelete).toBe(true)
    expect(json.foods[1].canDelete).toBe(false)
    expect(prisma.foodLibraryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ deletedAt: null }),
    }))
  })

  it('crée un aliment visible par tous par défaut', async () => {
    ;(prisma.foodLibraryItem.create as ReturnType<typeof vi.fn>).mockResolvedValue(food())

    const res = await POST(request('POST', {
      name:            'Riz maison',
      category:        'carb',
      caloriesPer100g: 130,
      proteinPer100g:  2.7,
      carbsPer100g:    28,
      fatPer100g:      0.3,
    }))

    expect(res.status).toBe(201)
    expect(prisma.foodLibraryItem.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        createdByUserId: 'user-1',
        visibility:      'PUBLIC',
        source:          'USER',
      }),
    }))
  })

  it('refuse de supprimer un aliment créé par un autre utilisateur', async () => {
    ;(prisma.foodLibraryItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(food({ createdByUserId: 'other-user' }))

    const res = await DELETE(request('DELETE', undefined, '/api/user/nutrition/foods/food-1'), { params: { foodId: 'food-1' } })

    expect(res.status).toBe(403)
    expect(prisma.foodLibraryItem.update).not.toHaveBeenCalled()
  })

  it('soft-delete un aliment créé par l’utilisateur connecté', async () => {
    ;(prisma.foodLibraryItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(food())
    ;(prisma.foodLibraryItem.update as ReturnType<typeof vi.fn>).mockResolvedValue(food())

    const res = await DELETE(request('DELETE', undefined, '/api/user/nutrition/foods/food-1'), { params: { foodId: 'food-1' } })

    expect(res.status).toBe(200)
    expect(prisma.foodLibraryItem.update).toHaveBeenCalledWith({
      where: { id: 'food-1' },
      data:  { deletedAt: expect.any(Date) },
    })
  })
})
