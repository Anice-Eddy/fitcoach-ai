'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { useLocale } from '@/contexts/LocaleContext'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bodyops.app'
const WEBHOOK_URL = `${APP_URL}/api/user/metrics/apple-health`

export function AppleHealthShortcut() {
  const { t } = useLocale()
  const [token,   setToken]   = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      title: t('integrations.appleHealth.steps.copyToken.title'),
      desc:  t('integrations.appleHealth.steps.copyToken.description'),
    },
    {
      title: t('integrations.appleHealth.steps.openShortcuts.title'),
      desc:  t('integrations.appleHealth.steps.openShortcuts.description'),
    },
    {
      title: t('integrations.appleHealth.steps.addActions.title'),
      desc:  t('integrations.appleHealth.steps.addActions.description'),
      actions: [
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.weight') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.bodyFat') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.muscleMass') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.steps') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.activeEnergy') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.sleep') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.heartRate') },
        { label: t('integrations.appleHealth.actions.findHealthData'), detail: t('integrations.appleHealth.actions.restingHeartRate') },
        { label: t('integrations.appleHealth.actions.findHealthDataAppleWatch'), detail: t('integrations.appleHealth.actions.vo2Max') },
        { label: t('integrations.appleHealth.actions.findHealthDataAppleWatch'), detail: t('integrations.appleHealth.actions.hrv') },
        { label: t('integrations.appleHealth.actions.findHealthDataAppleWatchS6'), detail: t('integrations.appleHealth.actions.spo2') },
        { label: t('integrations.appleHealth.actions.createDictionary'), detail: t('integrations.appleHealth.actions.dictionaryDetail') },
        { label: t('integrations.appleHealth.actions.getUrlContent'), detail: `${t('integrations.appleHealth.actions.url')} : ${WEBHOOK_URL}\n${t('integrations.appleHealth.actions.method')} : POST\n${t('integrations.appleHealth.actions.headers')} : Authorization -> Bearer [${t('integrations.appleHealth.actions.pasteToken')}]\n${t('integrations.appleHealth.actions.body')} : JSON -> ${t('integrations.appleHealth.actions.dictionaryAbove')}` },
      ],
    },
    {
      title: t('integrations.appleHealth.steps.automate.title'),
      desc:  t('integrations.appleHealth.steps.automate.description'),
    },
  ]

  useEffect(() => {
    setLoading(true)
    fetch('/api/user/apple-health-token')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.token && setToken(d.token))
      .finally(() => setLoading(false))
  }, [])

  const copy = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative size-9 shrink-0">
          <Image src="/icons/apple-health.svg" alt="Apple Health" fill className="object-contain" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Apple Health</h3>
          <p className="text-xs text-zinc-400">{t('integrations.appleHealth.subtitle')}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8F135]/10 text-[#C8F135] font-medium">{t('integrations.appleHealth.active')}</span>
      </div>

      {/* Token */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">{t('integrations.appleHealth.personalToken')}</p>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5">
          <code className="flex-1 text-xs text-zinc-300 font-mono truncate">
            {loading ? t('common.loading') : (token ?? t('common.error'))}
          </code>
          <button
            type="button"
            onClick={copy}
            disabled={!token}
            className="shrink-0 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
          >
            {copied ? <Check className="size-4 text-[#C8F135]" /> : <Copy className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">{t('integrations.appleHealth.tokenWarning')}</p>
      </div>

      {/* Instructions toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-[#C8F135] hover:text-[#d4f54d] transition-colors"
      >
        <Smartphone className="size-4" />
        {open ? t('integrations.appleHealth.hide') : t('integrations.appleHealth.show')} {t('integrations.appleHealth.setupInstructions')}
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {open && (
        <ol className="space-y-4 border-t border-zinc-800 pt-4">
          {steps.map((step, i) => (
            <li key={i} className="space-y-1.5">
              <p className="text-xs font-semibold text-white">{step.title}</p>
              {step.desc && <p className="text-xs text-zinc-400">{step.desc}</p>}
              {step.actions && (
                <ol className="space-y-2 pl-2">
                  {step.actions.map((action, j) => (
                    <li key={j} className="rounded-lg bg-zinc-800 px-3 py-2">
                      <p className="text-xs font-medium text-white">{j + 1}. {action.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 whitespace-pre-line">{action.detail}</p>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
          <li>
            <p className="text-xs font-semibold text-white">{t('integrations.appleHealth.syncedData')}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                t('integrations.appleHealth.data.weight'),
                t('integrations.appleHealth.data.bodyFat'),
                t('integrations.appleHealth.data.muscleMass'),
                t('integrations.appleHealth.data.steps'),
                t('integrations.appleHealth.data.activeCalories'),
                t('integrations.appleHealth.data.sleep'),
                t('integrations.appleHealth.data.avgHeartRate'),
                t('integrations.appleHealth.data.restingHeartRate'),
                t('integrations.appleHealth.data.vo2Max'),
                t('integrations.appleHealth.data.hrv'),
                t('integrations.appleHealth.data.spo2'),
              ].map(d => (
                <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{d}</span>
              ))}
            </div>
          </li>
        </ol>
      )}
    </div>
  )
}
