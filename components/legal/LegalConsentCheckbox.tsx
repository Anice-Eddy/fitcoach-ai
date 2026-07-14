'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

type LegalConsentCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

/** Reusable account-level consent block for terms and privacy acceptance during sign-up. */
export function LegalConsentCheckbox({ checked, onChange, error }: LegalConsentCheckboxProps) {
  const { t } = useLocale()

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-4 rounded border-zinc-700 bg-zinc-950 accent-[#C8F135]"
        />
        <span className="text-xs leading-relaxed text-zinc-400">
          <span className="mb-1 flex items-center gap-1.5 font-semibold text-zinc-200">
            <ShieldCheck className="size-3.5 text-[#C8F135]" />
            {t('legalConsent.account.title')}
          </span>
          {t('legalConsent.account.checkbox')}{' '}
          <Link href="/terms" target="_blank" className="text-[#C8F135] underline-offset-4 hover:underline">
            {t('common.terms')}
          </Link>{' '}
          {t('legalConsent.account.and')}{' '}
          <Link href="/privacy" target="_blank" className="text-[#C8F135] underline-offset-4 hover:underline">
            {t('common.privacy')}
          </Link>
          <span className="mt-1 block text-zinc-500">{t('legalConsent.account.body')}</span>
        </span>
      </label>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
