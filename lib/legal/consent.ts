export const LEGAL_POLICY_VERSION = '2026-07-14'
export const PRIVACY_POLICY_VERSION = LEGAL_POLICY_VERSION
export const TERMS_POLICY_VERSION = LEGAL_POLICY_VERSION
export const HEALTH_CONSENT_VERSION = LEGAL_POLICY_VERSION

export type LegalAcceptancePayload = {
  termsAccepted?: boolean
  privacyAccepted?: boolean
  policyVersion?: string
  locale?: string | null
}

export type HealthDataConsentPayload = {
  healthDataConsentAccepted?: boolean
  policyVersion?: string
  locale?: string | null
}

export function legalAcceptanceForLocale(locale: string): LegalAcceptancePayload {
  return {
    termsAccepted: true,
    privacyAccepted: true,
    policyVersion: LEGAL_POLICY_VERSION,
    locale,
  }
}

export function healthDataConsentForLocale(locale: string): HealthDataConsentPayload {
  return {
    healthDataConsentAccepted: true,
    policyVersion: HEALTH_CONSENT_VERSION,
    locale,
  }
}

export function isLegalAcceptanceComplete(payload?: LegalAcceptancePayload | null) {
  return payload?.termsAccepted === true && payload?.privacyAccepted === true
}

export function isHealthDataConsentComplete(payload?: HealthDataConsentPayload | null) {
  return payload?.healthDataConsentAccepted === true
}

export function userLegalAcceptanceData(payload?: LegalAcceptancePayload | null, acceptedAt = new Date()) {
  if (!isLegalAcceptanceComplete(payload)) return null

  return {
    termsAcceptedAt: acceptedAt,
    privacyAcceptedAt: acceptedAt,
    legalPolicyVersion: payload?.policyVersion ?? LEGAL_POLICY_VERSION,
    legalConsentLocale: payload?.locale ?? null,
  }
}

export function profileHealthConsentData(payload?: HealthDataConsentPayload | null, acceptedAt = new Date()) {
  if (!isHealthDataConsentComplete(payload)) return null

  return {
    healthDataConsentAt: acceptedAt,
    healthDataConsentVersion: payload?.policyVersion ?? HEALTH_CONSENT_VERSION,
    healthDataConsentLocale: payload?.locale ?? null,
  }
}
