'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { BackButton } from '@/components/ui/BackButton'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useLocale } from '@/contexts/LocaleContext'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  )
}

/** Client-rendered privacy policy so the legal page follows the selected BodyOps language. */
export function PrivacyContent() {
  const { t } = useLocale()
  const rows = ['identity', 'body', 'goals', 'health', 'nutrition', 'training', 'coach', 'ai', 'payments', 'login']

  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />

      <header className="relative z-10 flex items-center gap-4 border-b border-zinc-800/60 px-6 py-5">
        <Logo href="/" size="md" />
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle compact />
          <BackButton className="inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl space-y-10 px-6 py-12">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('privacy.title')}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t('legal.lastUpdated')} {t('legal.lastUpdatedDate')}</p>
        </div>

        <Section title={t('privacy.sections.who.title')}>
          <p>{t('privacy.sections.who.body')}</p>
        </Section>

        <Section title={t('privacy.sections.data.title')}>
          <p>{t('privacy.sections.data.intro')}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800/70">
            <table className="min-w-[720px] w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-700 text-left text-zinc-400">
                  <th className="p-3 font-semibold">{t('privacy.table.category')}</th>
                  <th className="p-3 font-semibold">{t('privacy.table.data')}</th>
                  <th className="p-3 font-semibold">{t('privacy.table.purpose')}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {rows.map((row) => (
                  <tr key={row} className="border-b border-zinc-800/50 last:border-0">
                    <td className="p-3 align-top font-medium text-white">{t(`privacy.rows.${row}.category`)}</td>
                    <td className="p-3 align-top">{t(`privacy.rows.${row}.data`)}</td>
                    <td className="p-3 align-top">{t(`privacy.rows.${row}.purpose`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={t('privacy.sections.legalBasis.title')}>
          <p>{t('privacy.sections.legalBasis.intro')}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{t('privacy.sections.legalBasis.consent')}</li>
            <li>{t('privacy.sections.legalBasis.contract')}</li>
            <li>{t('privacy.sections.legalBasis.legitimate')}</li>
          </ul>
        </Section>

        {['sensitive', 'ai', 'coachSharing', 'processors', 'international', 'retention', 'sharing', 'rights', 'security', 'breach', 'cookies', 'children', 'canada', 'contact'].map((section) => (
          <Section key={section} title={t(`privacy.sections.${section}.title`)}>
            <p>{t(`privacy.sections.${section}.body`)}</p>
          </Section>
        ))}

        <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          <Link href="/terms" className="transition-colors hover:text-white">{t('privacy.termsLink')}</Link>
        </div>
      </main>
    </div>
  )
}
