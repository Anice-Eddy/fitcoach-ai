import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { Logo } from '@/components/ui/Logo'
import { CoachCompletionForm } from './CoachCompletionForm'

export const dynamic = 'force-dynamic'

function toDateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ''
}

export default async function CompleteCoachProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/auth/coach/complete')
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true,
      name: true,
      coachProfile: {
        select: {
          firstName: true,
          lastName: true,
          birthDate: true,
          bio: true,
          specialties: true,
          certifications: true,
          yearsExperience: true,
          documentFileName: true,
          verificationIssues: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/auth/signin?callbackUrl=/coach/dashboard')
  }

  const coachProfile = user.coachProfile ?? await prisma.coachProfile.create({
    data: {
      userId:          user.id,
      bio:             null,
      specialties:     [],
      certifications:  [],
      yearsExperience: null,
      city:            null,
      phone:           null,
    },
  })

  const [firstName = '', ...lastNameParts] = (user.name ?? '').split(' ').filter(Boolean)
  const issues = Array.isArray(coachProfile.verificationIssues) ? coachProfile.verificationIssues : []

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo href="/" size="lg" />
          <a href="/coach/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Continuer vers le dashboard
          </a>
        </div>
        <CoachCompletionForm
          initialProfile={{
            firstName:          coachProfile.firstName ?? firstName,
            lastName:           coachProfile.lastName ?? lastNameParts.join(' '),
            birthDate:          toDateInput(coachProfile.birthDate),
            specialty:          coachProfile.specialties[0] ?? '',
            experience:         coachProfile.yearsExperience?.toString() ?? '',
            certifications:     coachProfile.certifications.join(', '),
            description:        coachProfile.bio ?? '',
            documentFileName:   coachProfile.documentFileName ?? '',
            verificationIssues: issues as { field: string; message: string }[],
          }}
        />
      </div>
    </main>
  )
}
