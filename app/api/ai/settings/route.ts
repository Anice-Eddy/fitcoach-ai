export const dynamic = 'force-dynamic'

// GET /api/ai/settings - returns the authenticated user's AI preferences.
// PATCH /api/ai/settings - updates aiMemoryEnabled / aiHistoryEnabled.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

const patchSchema = z.object({
  aiMemoryEnabled:  z.boolean().optional(),
  aiHistoryEnabled: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where:  { userId: session.user.id },
    select: { aiMemoryEnabled: true, aiHistoryEnabled: true },
  })

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 422 })

  const profile = await prisma.profile.update({
    where:  { userId: session.user.id },
    data:   parsed.data,
    select: { aiMemoryEnabled: true, aiHistoryEnabled: true },
  })

  return NextResponse.json(profile)
}
