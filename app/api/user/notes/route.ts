export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSchema = z.object({
  title:    z.string().min(1).max(150),
  content:  z.string().min(1).max(10000),
  category: z.string().nullable().optional(),
  tags:     z.array(z.string().max(30)).max(10).default([]),
  isPinned: z.boolean().default(false),
})

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) })

async function getUser() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  return { userId: session.user.id }
}

// GET: all notes for the authenticated user
export async function GET(_req: NextRequest) {
  const { userId, error } = await getUser()
  if (error) return error

  const notes = await prisma.userNote.findMany({
    where:   { userId },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(notes)
}

// POST: create a note
export async function POST(req: NextRequest) {
  const { userId, error } = await getUser()
  if (error) return error

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const note = await prisma.userNote.create({
    data: { userId, ...parsed.data },
  })

  return NextResponse.json(note, { status: 201 })
}

// PATCH: update a note
export async function PATCH(req: NextRequest) {
  const { userId, error } = await getUser()
  if (error) return error

  const parsed = updateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { id, ...data } = parsed.data

  const existing = await prisma.userNote.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })
  }

  const note = await prisma.userNote.update({ where: { id }, data })
  return NextResponse.json(note)
}

// DELETE: delete a note
export async function DELETE(req: NextRequest) {
  const { userId, error } = await getUser()
  if (error) return error

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  const existing = await prisma.userNote.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })
  }

  await prisma.userNote.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
