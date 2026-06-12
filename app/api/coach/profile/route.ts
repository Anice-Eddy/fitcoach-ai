export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { analyzeCoachDocument } from '@/lib/coach/verification'

const coachProfileSchema = z.object({
  firstName:       z.string().min(1, 'Le prénom est requis'),
  lastName:        z.string().min(1, 'Le nom de famille est requis'),
  birthDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La date de naissance est requise'),
  specialty:       z.string().min(1, 'La spécialité est requise'),
  experience:      z.preprocess((value) => Number(value), z.number().int().min(0).max(60)),
  certifications:  z.string().min(1, 'Ajoutez au moins une certification'),
  description:     z.string().min(30, 'La description professionnelle doit faire au moins 30 caractères'),
  showYearsExperience: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  showMemberCount: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  publicRating: z.preprocess(
    (value) => value === '' || value === null ? null : Number(value),
    z.number().min(0).max(5).nullable(),
  ),
  publicRatingCount: z.preprocess((value) => Number(value || 0), z.number().int().min(0).max(100000)),
  showPublicRating: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  discoveryCallEnabled: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  discoveryCallTitle: z.string().min(2).max(80).default('Entretien découverte'),
  discoveryCallDuration: z.preprocess((value) => Number(value || 30), z.number().int().min(5).max(180)),
  showDiscoveryCall: z.preprocess((value) => value === 'true', z.boolean()).default(true),
})

// Splits a comma-separated string into a trimmed, non-empty string array.
function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// Reads up to 8000 chars from a text/JSON File; returns empty string for non-text files or null.
async function readDocumentText(file: File | null) {
  if (!file) return ''
  if (file.type.startsWith('text/') || file.type === 'application/json') {
    return (await file.text()).slice(0, 8000)
  }
  return ''
}

// Upserts a blank coachProfile record for userId if none exists, then returns it.
async function getCoachProfile(userId: string) {
  return prisma.coachProfile.upsert({
    where:  { userId },
    update: {},
    create: {
      userId,
      bio:             null,
      specialties:     [],
      certifications:  [],
      yearsExperience: null,
      city:            null,
      phone:           null,
    },
  })
}

/** Returns the coach profile for the authenticated user, or null if not found. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
  })
  return NextResponse.json(profile)
}

/** Creates the authenticated user's coach space without duplicating the account email. */
export async function POST(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // The upsert keeps this action idempotent if the button is clicked twice.
  const profile = await getCoachProfile(session.user.id)
  return NextResponse.json(profile, { status: 201 })
}

/** Updates the coach profile from a multipart form; analyzes any uploaded certification document and sets the verification status accordingly. */
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const parsed = coachProfileSchema.safeParse({
    firstName:      formData.get('firstName'),
    lastName:       formData.get('lastName'),
    birthDate:      formData.get('birthDate'),
    specialty:      formData.get('specialty'),
    experience:     formData.get('experience'),
    certifications: formData.get('certifications'),
    description:    formData.get('description'),
    showYearsExperience: formData.get('showYearsExperience') ?? 'true',
    showMemberCount: formData.get('showMemberCount') ?? 'true',
    publicRating: formData.get('publicRating') ?? null,
    publicRatingCount: formData.get('publicRatingCount') ?? '0',
    showPublicRating: formData.get('showPublicRating') ?? 'false',
    discoveryCallEnabled: formData.get('discoveryCallEnabled') ?? 'true',
    discoveryCallTitle: formData.get('discoveryCallTitle') ?? 'Entretien découverte',
    discoveryCallDuration: formData.get('discoveryCallDuration') ?? '30',
    showDiscoveryCall: formData.get('showDiscoveryCall') ?? 'true',
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const current = await getCoachProfile(session.user.id)
  const documentValue = formData.get('document')
  const document = documentValue instanceof File && documentValue.size > 0 ? documentValue : null
  const documentText = await readDocumentText(document)
  const documentFileName = document?.name ?? current.documentFileName
  const documentMimeType = document?.type ?? current.documentMimeType

  const verification = analyzeCoachDocument({
    firstName:        parsed.data.firstName,
    lastName:         parsed.data.lastName,
    birthDate:        parsed.data.birthDate,
    documentName:     documentFileName,
    documentMimeType,
    documentText,
  })

  const updated = await prisma.coachProfile.update({
    where: { id: current.id },
    data:  {
      firstName:          parsed.data.firstName.trim(),
      lastName:           parsed.data.lastName.trim(),
      birthDate:          new Date(`${parsed.data.birthDate}T00:00:00.000Z`),
      bio:                parsed.data.description.trim(),
      specialties:        [parsed.data.specialty.trim()],
      certifications:     splitList(parsed.data.certifications),
      yearsExperience:    parsed.data.experience,
      showYearsExperience: parsed.data.showYearsExperience,
      showMemberCount:    parsed.data.showMemberCount,
      publicRating:       parsed.data.publicRating,
      publicRatingCount:  parsed.data.publicRatingCount,
      showPublicRating:   parsed.data.showPublicRating,
      discoveryCallEnabled: parsed.data.discoveryCallEnabled,
      discoveryCallTitle: parsed.data.discoveryCallTitle.trim(),
      discoveryCallDuration: parsed.data.discoveryCallDuration,
      showDiscoveryCall:  parsed.data.showDiscoveryCall,
      verificationStatus: verification.status,
      verificationIssues: verification.issues,
      verificationAnalysis: verification.analysis,
      isVerified:         false,
      ...(document
        ? {
            documentFileName:   document.name,
            documentMimeType:   document.type || 'application/octet-stream',
            documentSize:       document.size,
            documentUploadedAt: new Date(),
          }
        : {}),
    },
  })

  return NextResponse.json(updated)
}
