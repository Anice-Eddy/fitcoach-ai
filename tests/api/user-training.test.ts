import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    workoutProgram: {
      findFirst:  vi.fn(),
      create:     vi.fn(),
      updateMany: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { DELETE, GET, POST } from '@/app/api/user/training/route'

const session = { user: { id: 'user-1' } }
const profile = {
  firstName:           'Alex',
  age:                 28,
  gender:              'MALE',
  weightKg:            78,
  heightCm:            178,
  activityLevel:       'MODERATELY_ACTIVE',
  fitnessGoal:         'MUSCLE_GAIN',
  fitnessLevel:        'INTERMEDIATE',
  bodyFocus:           'FULL_BODY',
  targetWeightKg:      82,
  trainingDaysPerWeek: 3,
  availableEquipment:  ['BARBELL', 'DUMBBELL', 'BENCH'],
  injuries:            null,
}

describe('/api/user/training', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(session)
    ;(prisma.workoutProgram.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(profile)
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('GROQ_API_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retourne 401 si non connecté', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('crée les séances avec leurs exerciseLogs persistés', async () => {
    ;(prisma.workoutProgram.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'program-1',
      sessions: [],
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const createCall = (prisma.workoutProgram.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const firstSession = createCall.data.sessions.create[0]
    expect(firstSession.exerciseLogs.create.length).toBeGreaterThan(0)
    expect(firstSession.exerciseLogs.create[0].exercise.connectOrCreate.where.id).toMatch(/^ex-/)
  })

  it('désactive les programmes actifs sur DELETE', async () => {
    ;(prisma.workoutProgram.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect((prisma.workoutProgram.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0].where)
      .toEqual({ userId: 'user-1', isActive: true })
  })

  it('régénère un programme sur POST avec fallback local', async () => {
    ;(prisma.workoutProgram.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    ;(prisma.workoutProgram.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'program-2',
      sessions: [],
    })

    const res = await POST()

    expect(res.status).toBe(200)
    expect(prisma.workoutProgram.updateMany).toHaveBeenCalled()
    expect(prisma.workoutProgram.create).toHaveBeenCalled()
  })
})
