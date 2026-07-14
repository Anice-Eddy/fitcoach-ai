import { describe, expect, it } from 'vitest'
import {
  LEGAL_POLICY_VERSION,
  healthDataConsentForLocale,
  isLegalAcceptanceComplete,
  legalAcceptanceForLocale,
  profileHealthConsentData,
  userLegalAcceptanceData,
} from '@/lib/legal/consent'

describe('legal consent helpers', () => {
  it('builds a complete account acceptance payload for the selected locale', () => {
    const payload = legalAcceptanceForLocale('fr')

    expect(payload).toEqual({
      termsAccepted: true,
      privacyAccepted: true,
      policyVersion: LEGAL_POLICY_VERSION,
      locale: 'fr',
    })
    expect(isLegalAcceptanceComplete(payload)).toBe(true)
  })

  it('returns null when account acceptance is incomplete', () => {
    expect(userLegalAcceptanceData({ termsAccepted: true })).toBeNull()
  })

  it('maps account acceptance to persisted user fields', () => {
    const acceptedAt = new Date('2026-07-14T10:00:00.000Z')

    expect(userLegalAcceptanceData(legalAcceptanceForLocale('en'), acceptedAt)).toEqual({
      termsAcceptedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt,
      legalPolicyVersion: LEGAL_POLICY_VERSION,
      legalConsentLocale: 'en',
    })
  })

  it('maps health consent to persisted profile fields', () => {
    const acceptedAt = new Date('2026-07-14T10:00:00.000Z')

    expect(profileHealthConsentData(healthDataConsentForLocale('fr'), acceptedAt)).toEqual({
      healthDataConsentAt: acceptedAt,
      healthDataConsentVersion: LEGAL_POLICY_VERSION,
      healthDataConsentLocale: 'fr',
    })
  })
})
