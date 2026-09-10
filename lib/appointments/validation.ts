import { z } from 'zod'

const id = z.string().trim().min(1).max(128)
const title = z.string().trim().min(2).max(120)
const optionalText = (max: number) => z.preprocess(
  (value) => value === '' ? null : value,
  z.string().trim().max(max).nullable().optional(),
)
const optionalUrl = z.preprocess(
  (value) => value === '' ? null : value,
  z.string().trim().url().max(500).refine(
    (value) => value.startsWith('https://') || value.startsWith('http://'),
    'Only HTTP(S) links are allowed',
  ).nullable().optional(),
)

const appointmentFields = {
  title,
  description: optionalText(4000),
  scheduledAt: z.coerce.date(),
  duration: z.coerce.number().int().min(15).max(240).default(60),
  meetLink: optionalUrl,
}

export const coachAppointmentCreateSchema = z.object({
  memberId: id,
  ...appointmentFields,
  coachNote: optionalText(4000),
}).strict()

export const memberAppointmentCreateSchema = z.object({
  coachProfileId: id,
  ...appointmentFields,
  memberNote: optionalText(4000),
}).strict()

export const coachAppointmentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  scheduledAt: z.coerce.date().optional(),
  duration: z.coerce.number().int().min(15).max(240).optional(),
  meetLink: optionalUrl,
  description: optionalText(4000),
  coachNote: optionalText(4000),
}).strict().refine((data) => Object.keys(data).length > 0, 'At least one field is required')

export const memberAppointmentUpdateSchema = z.object({
  memberNote: optionalText(4000),
}).strict().refine((data) => Object.prototype.hasOwnProperty.call(data, 'memberNote'), 'memberNote is required')
