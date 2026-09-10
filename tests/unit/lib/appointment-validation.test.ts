import { describe, expect, it } from 'vitest'
import {
  coachAppointmentCreateSchema,
  coachAppointmentUpdateSchema,
  memberAppointmentCreateSchema,
  memberAppointmentUpdateSchema,
} from '@/lib/appointments/validation'

describe('appointment validation', () => {
  const base = {
    title: 'Weekly coaching review',
    scheduledAt: '2026-09-20T14:00:00.000Z',
    duration: 60,
  }

  it('normalizes valid create payloads', () => {
    const coach = coachAppointmentCreateSchema.parse({ ...base, memberId: 'member-1', meetLink: '' })
    const member = memberAppointmentCreateSchema.parse({ ...base, coachProfileId: 'coach-1', memberNote: ' Ready ' })

    expect(coach.scheduledAt).toBeInstanceOf(Date)
    expect(coach.meetLink).toBeNull()
    expect(member.memberNote).toBe('Ready')
  })

  it('rejects invalid durations, links and unexpected fields', () => {
    expect(coachAppointmentCreateSchema.safeParse({
      ...base,
      memberId: 'member-1',
      duration: 5,
    }).success).toBe(false)

    expect(memberAppointmentCreateSchema.safeParse({
      ...base,
      coachProfileId: 'coach-1',
      meetLink: 'javascript:alert(1)',
      injected: true,
    }).success).toBe(false)
  })

  it('requires at least one supported update field', () => {
    expect(coachAppointmentUpdateSchema.safeParse({}).success).toBe(false)
    expect(coachAppointmentUpdateSchema.safeParse({ status: 'CONFIRMED' }).success).toBe(true)
    expect(memberAppointmentUpdateSchema.safeParse({ memberNote: null }).success).toBe(true)
    expect(memberAppointmentUpdateSchema.safeParse({ status: 'CANCELLED' }).success).toBe(false)
  })
})
