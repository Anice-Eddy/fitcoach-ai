export type CoachVerificationIssue = {
  field: 'firstName' | 'lastName' | 'birthDate' | 'document'
  message: string
}

type CoachVerificationInput = {
  firstName: string
  lastName: string
  birthDate: string
  documentName?: string | null
  documentMimeType?: string | null
  documentText?: string
}

// Strips accents and lowercases a string for locale-agnostic comparison.
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Returns multiple date format variants (ISO, DD/MM/YYYY, etc.) for a given ISO date string.
function dateVariants(isoDate: string) {
  if (!isoDate) return []
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return [isoDate]
  return [
    isoDate,
    `${day}/${month}/${year}`,
    `${day}-${month}-${year}`,
    `${day}.${month}.${year}`,
  ]
}

/** Validates coach identity document by checking that first name, last name, and birth date appear in the document text; returns status and a list of field-level issues. */
export function analyzeCoachDocument(input: CoachVerificationInput) {
  const issues: CoachVerificationIssue[] = []
  const documentText = `${input.documentName ?? ''} ${input.documentText ?? ''}`.trim()
  const normalizedDocument = normalize(documentText)
  const hasReadableText = normalizedDocument.length > 0

  if (!input.documentName) {
    issues.push({
      field:   'document',
      message: 'A diploma, certification, or official document must be uploaded.',
    })
  }

  if (!input.firstName.trim()) {
    issues.push({ field: 'firstName', message: 'The profile first name is missing.' })
  } else if (!hasReadableText || !normalizedDocument.includes(normalize(input.firstName))) {
    issues.push({
      field:   'firstName',
      message: 'The document first name does not match the profile first name.',
    })
  }

  if (!input.lastName.trim()) {
    issues.push({ field: 'lastName', message: 'The profile last name is missing.' })
  } else if (!hasReadableText || !normalizedDocument.includes(normalize(input.lastName))) {
    issues.push({
      field:   'lastName',
      message: 'The document last name does not match.',
    })
  }

  if (!input.birthDate) {
    issues.push({ field: 'birthDate', message: 'The profile birth date is missing.' })
  } else if (!dateVariants(input.birthDate).some((variant) => normalizedDocument.includes(normalize(variant)))) {
    issues.push({
      field:   'birthDate',
      message: 'The birth date is missing from the document.',
    })
  }

  return {
    status: issues.length > 0 ? 'NEEDS_CORRECTION' as const : 'PENDING_VERIFICATION' as const,
    issues,
    analysis: {
      documentName:     input.documentName ?? null,
      documentMimeType: input.documentMimeType ?? null,
      readableText:     hasReadableText,
      checkedFields:    ['firstName', 'lastName', 'birthDate'],
    },
  }
}

/** Returns true when all required coach profile fields (name, birth date, bio, specialties, certifications, experience, document) are present. */
export function isCoachProfileComplete(profile: {
  firstName?: string | null
  lastName?: string | null
  birthDate?: Date | string | null
  bio?: string | null
  specialties?: string[] | null
  certifications?: string[] | null
  yearsExperience?: number | null
  documentFileName?: string | null
}) {
  return Boolean(
    profile.firstName
      && profile.lastName
      && profile.birthDate
      && profile.bio
      && (profile.specialties?.length ?? 0) > 0
      && (profile.certifications?.length ?? 0) > 0
      && profile.yearsExperience !== null
      && profile.yearsExperience !== undefined
      && profile.documentFileName,
  )
}
