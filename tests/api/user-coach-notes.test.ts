import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/notes/replies', () => ({ getNormalizedCoachNoteReplies: vi.fn(async () => []) }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    coachNote: {
      findMany: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET } from '@/app/api/user/coach-notes/route'

function noteFixture() {
  return {
    id:          'note-1',
    title:       'Nutrition',
    content:     'Adjust breakfast',
    category:    'Nutrition',
    tags:        [],
    isPinned:    false,
    isImportant: false,
    createdAt:   new Date('2026-06-01T10:00:00.000Z'),
    coachProfile: {
      user: { name: null, image: null },
    },
    replies: [],
  }
}

describe('GET /api/user/coach-notes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'member-1' } })
    ;(prisma.coachNote.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([noteFixture()])
  })

  it('uses the French coach fallback for French profiles', async () => {
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'fr' })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json[0].coachName).toBe('Votre coach')
  })

  it('uses the English coach fallback for English profiles', async () => {
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'en' })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json[0].coachName).toBe('Your coach')
  })
})
