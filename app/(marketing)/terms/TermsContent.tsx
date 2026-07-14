'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { BackButton } from '@/components/ui/BackButton'
import { useLocale } from '@/contexts/LocaleContext'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-zinc-400">{children}</div>
    </section>
  )
}

/** Client-rendered terms page so legal content follows the selected BodyOps language. */
export function TermsContent() {
  const { t } = useLocale()

  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />

      <header className="relative z-10 flex items-center gap-4 border-b border-zinc-800/60 px-6 py-5">
        <Logo href="/" size="md" />
        <div className="ml-auto flex items-center gap-2">
          <BackButton className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl space-y-10 px-6 py-12">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('terms.title')}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t('legal.lastUpdated')} {t('legal.lastUpdatedDate')}</p>
        </div>

        <Section title={t('terms.sections.service.title')}>
          <p>{t('terms.sections.service.body')}</p>
          <p className="mt-3">{t('terms.sections.service.age')}</p>
        </Section>

        <Section title={t('terms.sections.warning.title')}>
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <p className="font-semibold text-amber-300">{t('terms.sections.warning.important')}</p>
            <p className="text-sm text-amber-200/80">{t('terms.sections.warning.body')}</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-200/80">
              <li>{t('terms.sections.warning.medical')}</li>
              <li>{t('terms.sections.warning.indicative')}</li>
              <li>{t('terms.sections.warning.liability')}</li>
            </ul>
          </div>
        </Section>

        {['account', 'intellectualProperty', 'liability', 'changes', 'contact'].map((section) => (
          <Section key={section} title={t(`terms.sections.${section}.title`)}>
            <p>{t(`terms.sections.${section}.body`)}</p>
          </Section>
        ))}

        <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          <Link href="/privacy" className="transition-colors hover:text-white">{t('terms.privacyLink')}</Link>
        </div>
      </main>
    </div>
  )
}
