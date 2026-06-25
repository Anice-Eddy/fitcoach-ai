export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { deleteExternalAuthUser } from '@/lib/firebase/delete-user'

const accountUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  image: z.string().url().or(z.literal('')).nullable().optional(),
  password: z.string().min(8, 'Mot de passe minimum : 8 caractères').optional(),
})

/** Updates the authenticated user's name, email, avatar image, or password; returns the updated user record. */
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

/** Permanently deletes the authenticated user account; requires password confirmation for credential-based accounts. */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  let password: string | undefined
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : undefined
  } catch { /* OAuth users may send no body */ }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, firebaseUid: true },
  })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  if (user.password) {
    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis pour confirmer la suppression.' }, { status: 422 })
    }
    const valid = await compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 403 })
    }
  }

  if (user.firebaseUid) {
    try {
      await deleteExternalAuthUser(user.firebaseUid)
    } catch (error) {
      console.error('[account-delete] external auth deletion failed:', error)
      return NextResponse.json({
        error: "La suppression du compte n'a pas pu être finalisée. Réessaie dans quelques instants.",
      }, { status: 503 })
    }
  }

  await prisma.user.delete({ where: { id: session.user.id } })
  return NextResponse.json({ success: true })
}
