import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    coachMember: {
      findUnique: vi.fn(),
    },
    exerciseLog: {
      findFirst: vi.fn(),
      delete:    vi.fn(),
    },
    workoutSession: {
      findFirst: vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { DELETE } from '@/app/api/coach/members/[memberId]/sessions/route'

function deleteReq(body: unknown) {
  return new Request('http://localhost/api/coach/members/member-1/sessions', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('DELETE /api/coach/members/[memberId]/sessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: 'coach@test.com' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'coach-user',
      email: 'coach@test.com',
      coachProfile: { id: 'coach-profile' },
    })
    ;(prisma.coachMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      coachId: 'coach-profile',
      memberId: 'member-1',
    })
    ;(prisma.exerciseLog.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'log-1' })
    ;(prisma.exerciseLog.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'log-1' })
    ;(prisma.workoutSession.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'session-1',
      userId: 'member-1',
      exerciseLogs: [],
    })
    ;(prisma.workoutSession.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'session-1' })
  })

  it('retourne 401 si le coach n’est pas connecté', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await DELETE(deleteReq({ sessionId: 'session-1', exerciseLogId: 'log-1' }) as never, {
      params: { memberId: 'member-1' },
    })

    expect(res.status).toBe(401)
  })

  it('supprime seulement un exercice appartenant à une séance du membre suivi', async () => {
    const res = await DELETE(deleteReq({ sessionId: 'session-1', exerciseLogId: 'log-1' }) as never, {
      params: { memberId: 'member-1' },
    })

    expect(res.status).toBe(200)
    expect(prisma.exerciseLog.findFirst).toHaveBeenCalledWith({
      where: { id: 'log-1', session: { id: 'session-1', userId: 'member-1' } },
      select: { id: true },
    })
    expect(prisma.exerciseLog.delete).toHaveBeenCalledWith({ where: { id: 'log-1' } })
    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'session-1', userId: 'member-1' },
    }))
  })

  it('retourne 404 si l’exercice ne correspond pas à cette séance membre', async () => {
    ;(prisma.exerciseLog.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await DELETE(deleteReq({ sessionId: 'session-1', exerciseLogId: 'log-2' }) as never, {
      params: { memberId: 'member-1' },
    })

    expect(res.status).toBe(404)
    expect(prisma.exerciseLog.delete).not.toHaveBeenCalled()
  })

  it('supprime une séance complète appartenant au membre suivi', async () => {
    const res = await DELETE(deleteReq({ sessionId: 'session-1' }) as never, {
      params: { memberId: 'member-1' },
    })

    expect(res.status).toBe(200)
    expect(prisma.workoutSession.findFirst).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'member-1' },
      select: { id: true },
    })
    expect(prisma.workoutSession.delete).toHaveBeenCalledWith({ where: { id: 'session-1' } })
  })
})
