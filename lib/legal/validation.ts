import { z } from 'zod'

export const legalAcceptanceSchema = z.object({
  termsAccepted: z.boolean(),
  privacyAccepted: z.boolean(),
  policyVersion: z.string().optional(),
  locale: z.string().max(10).nullable().optional(),
})

export const optionalLegalAcceptanceSchema = legalAcceptanceSchema.optional()

export const legalAcceptanceBodySchema = z.object({
  legalAcceptance: optionalLegalAcceptanceSchema,
}).optional()
