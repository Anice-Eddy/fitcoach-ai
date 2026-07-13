import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    coachProfile: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/coach/verification', () => ({
  analyzeCoachDocument: vi.fn(() => ({ status: 'PENDING', issues: [], analysis: null })),
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { PATCH } from '@/app/api/coach/profile/route'

function patchRequest(formData: FormData) {
  return new Request('http://localhost/api/coach/profile', {
    method: 'PATCH',
    body:   formData,
  })
}

describe('PATCH /api/coach/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'coach-user-1' } })
  })

  it('returns English validation errors for missing certifications', async () => {
    const formData = new FormData()
    formData.set('firstName', 'Alex')
    formData.set('lastName', 'Coach')
    formData.set('birthDate', '1990-01-01')
    formData.set('specialty', 'Strength')
    formData.set('experience', '5')
    formData.set('certifications', '')
    formData.set('description', 'Professional coach with enough detail for the validation rule.')

    const res = await PATCH(patchRequest(formData))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error.certifications[0]).toBe('Add at least one certification')
    expect(prisma.coachProfile.update).not.toHaveBeenCalled()
  })
})
