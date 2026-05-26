import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const accountUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  image: z.string().url().or(z.literal('')).optional(),
  password: z.string().min(8, 'Mot de passe minimum : 8 caractères').optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = accountUpdateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.image !== undefined ? { image: data.image || null } : {}),
      ...(data.password ? { password: await hash(data.password, 12) } : {}),
    },
    select: { id: true, name: true, email: true, image: true, provider: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true })
}
