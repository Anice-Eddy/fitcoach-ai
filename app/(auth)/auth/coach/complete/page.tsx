import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { Logo } from '@/components/ui/Logo'
import { CoachCompletionForm } from './CoachCompletionForm'

export const dynamic = 'force-dynamic'

function toDateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : ''
}

/** Server component that fetches the coach's existing profile and renders the CoachCompletionForm; redirects to sign-in if unauthenticated. */
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
      profile: { select: { id: true } },
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

  if (user.profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 text-white">
        <section className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-xl font-semibold text-white">Ce Gmail est déjà un compte membre</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Pour éviter de mélanger vos données membre et coach, ce compte ne peut pas être converti en espace coach.
            Utilisez une autre adresse email pour créer ou connecter un compte coach.
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d]"
          >
            Retour à mon espace membre
          </a>
        </section>
      </main>
    )
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
