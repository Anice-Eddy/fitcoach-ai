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

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

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

export function analyzeCoachDocument(input: CoachVerificationInput) {
  const issues: CoachVerificationIssue[] = []
  const documentText = `${input.documentName ?? ''} ${input.documentText ?? ''}`.trim()
  const normalizedDocument = normalize(documentText)
  const hasReadableText = normalizedDocument.length > 0

  if (!input.documentName) {
    issues.push({
      field:   'document',
      message: 'Un diplôme, une certification ou un document officiel doit être envoyé.',
    })
  }

  if (!input.firstName.trim()) {
    issues.push({ field: 'firstName', message: 'Le prénom du profil est manquant.' })
  } else if (!hasReadableText || !normalizedDocument.includes(normalize(input.firstName))) {
    issues.push({
      field:   'firstName',
      message: 'Le prénom du document ne correspond pas au prénom du profil.',
    })
  }

  if (!input.lastName.trim()) {
    issues.push({ field: 'lastName', message: 'Le nom de famille du profil est manquant.' })
  } else if (!hasReadableText || !normalizedDocument.includes(normalize(input.lastName))) {
    issues.push({
      field:   'lastName',
      message: 'Le nom de famille ne correspond pas.',
    })
  }

  if (!input.birthDate) {
    issues.push({ field: 'birthDate', message: 'La date de naissance du profil est manquante.' })
  } else if (!dateVariants(input.birthDate).some((variant) => normalizedDocument.includes(normalize(variant)))) {
    issues.push({
      field:   'birthDate',
      message: 'La date de naissance est manquante sur le document.',
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
