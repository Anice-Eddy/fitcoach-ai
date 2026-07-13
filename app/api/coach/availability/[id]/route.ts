export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Deletes a specific availability rule, verifying the rule belongs to the authenticated coach. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!user?.coachProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const rule = await prisma.coachAvailability.findUnique({ where: { id: params.id } })
  if (!rule || rule.coachId !== user.coachProfile.id) {
    return NextResponse.json({ error: 'Availability rule not found' }, { status: 404 })
  }

  await prisma.coachAvailability.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
