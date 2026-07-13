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
import { DELETE, PATCH } from '@/app/api/user/nutrition/foods/[foodId]/route'

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
    nameFr:          'Riz maison',
    nameEn:          'Homemade rice',
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

  it('returns public foods and marks which ones the creator can delete', async () => {
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

  it('returns localized food names for English users', async () => {
    ;(prisma.foodLibraryItem.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      food(),
    ])

    const res = await GET(request('GET', undefined, '/api/user/nutrition/foods?locale=en&q=rice'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.foods[0].displayName).toBe('Homemade rice')
    expect(prisma.foodLibraryItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          expect.objectContaining({
            OR: expect.arrayContaining([
              { nameEn: { contains: 'rice', mode: 'insensitive' } },
            ]),
          }),
        ]),
      }),
    }))
  })

  it('creates a food that is public by default', async () => {
    ;(prisma.foodLibraryItem.create as ReturnType<typeof vi.fn>).mockResolvedValue(food())

    const res = await POST(request('POST', {
      nameFr:          'Riz maison',
      nameEn:          'Homemade rice',
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
        name:            'Riz maison',
        nameFr:          'Riz maison',
        nameEn:          'Homemade rice',
        visibility:      'PUBLIC',
        source:          'USER',
      }),
    }))
  })

  it('refuses to delete a food created by another user', async () => {
    ;(prisma.foodLibraryItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(food({ createdByUserId: 'other-user' }))

    const res = await DELETE(request('DELETE', undefined, '/api/user/nutrition/foods/food-1'), { params: { foodId: 'food-1' } })

    expect(res.status).toBe(403)
    expect(prisma.foodLibraryItem.update).not.toHaveBeenCalled()
  })

  it('soft-deletes a food created by the signed-in user', async () => {
    ;(prisma.foodLibraryItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(food())
    ;(prisma.foodLibraryItem.update as ReturnType<typeof vi.fn>).mockResolvedValue(food())

    const res = await DELETE(request('DELETE', undefined, '/api/user/nutrition/foods/food-1'), { params: { foodId: 'food-1' } })

    expect(res.status).toBe(200)
    expect(prisma.foodLibraryItem.update).toHaveBeenCalledWith({
      where: { id: 'food-1' },
      data:  { deletedAt: expect.any(Date) },
    })
  })

  it('updates localized names only for the food creator', async () => {
    ;(prisma.foodLibraryItem.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(food())
    ;(prisma.foodLibraryItem.update as ReturnType<typeof vi.fn>).mockResolvedValue(food({ nameEn: 'Updated rice' }))

    const res = await PATCH(request('PATCH', { nameEn: 'Updated rice' }, '/api/user/nutrition/foods/food-1'), { params: { foodId: 'food-1' } })

    expect(res.status).toBe(200)
    expect(prisma.foodLibraryItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'food-1' },
      data: expect.objectContaining({
        name:   'Updated rice',
        nameEn: 'Updated rice',
      }),
    }))
  })
})
