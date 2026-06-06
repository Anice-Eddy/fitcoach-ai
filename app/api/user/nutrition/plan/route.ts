export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

/** Returns the authenticated member's active coach nutrition target, when one exists. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const plan = await prisma.nutritionPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(plan)
}
