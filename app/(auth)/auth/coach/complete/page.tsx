import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

export default async function CompleteCoachGoogleSignInPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/auth/coach/complete')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, coachProfile: { select: { id: true } } },
  })

  if (!user) {
    redirect('/auth/signin?callbackUrl=/coach/dashboard')
  }

  if (!user.coachProfile) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: 'BUSINESS',
        coachProfile: {
          create: {
            bio: null,
            specialties: [],
            certifications: [],
            yearsExperience: null,
            city: null,
            phone: null,
          },
        },
      },
    })
  }

  redirect('/coach/dashboard')
}
