export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export type AvailableSlot = {
  datetime: string  // ISO string
  duration: number  // minutes
}

/** Returns available booking slots for a coach over a date range, excluding already-booked times. */
export async function GET(
  req: NextRequest,
  { params }: { params: { coachId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get('from')
  const toParam   = searchParams.get('to')

  const from = fromParam ? new Date(fromParam) : new Date()
  const to   = toParam   ? new Date(toParam)   : new Date(Date.now() + 14 * 86_400_000)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)

  const coach = await prisma.coachProfile.findUnique({ where: { id: params.coachId } })
  if (!coach) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const [rules, appointments] = await Promise.all([
    prisma.coachAvailability.findMany({ where: { coachId: params.coachId } }),
    prisma.coachAppointment.findMany({
      where: {
        coachId:     params.coachId,
        scheduledAt: { gte: from, lte: to },
        status:      { in: ['PENDING', 'PROPOSED', 'CONFIRMED'] },
      },
      select: { scheduledAt: true, duration: true },
    }),
  ])

  const now = new Date()
  const slots: AvailableSlot[] = []

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    // ISO day of week: JS getDay() returns 0=Sun, 1=Mon..6=Sat; convert to 1=Mon..7=Sun.
    const iso  = d.getDay() === 0 ? 7 : d.getDay()
    const dayRules = rules.filter(r => r.dayOfWeek === iso)

    for (const rule of dayRules) {
      let h = rule.startHour
      let m = rule.startMinute

      while (h * 60 + m + rule.slotDuration <= rule.endHour * 60 + rule.endMinute) {
        const slotStart = new Date(d)
        slotStart.setHours(h, m, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + rule.slotDuration * 60_000)

        if (slotStart > now) {
          const conflicts = appointments.some(apt => {
            const aptStart = new Date(apt.scheduledAt)
            const aptEnd   = new Date(aptStart.getTime() + apt.duration * 60_000)
            return slotStart < aptEnd && slotEnd > aptStart
          })
          if (!conflicts) {
            slots.push({ datetime: slotStart.toISOString(), duration: rule.slotDuration })
          }
        }

        m += rule.slotDuration
        while (m >= 60) { h++; m -= 60 }
      }
    }
  }

  return NextResponse.json(slots)
}
