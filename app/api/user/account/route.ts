import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true })
}
