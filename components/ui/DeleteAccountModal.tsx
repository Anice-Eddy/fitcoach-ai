'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

const CONFIRM_WORD = 'SUPPRIMER'

interface Props {
  onConfirm: (password: string | undefined) => Promise<void>
  onCancel:  () => void
  deleting:  boolean
}

/** Confirmation modal that requires the user to type 'SUPPRIMER' before calling onConfirm with an optional password. */
export function DeleteAccountModal({ onConfirm, onCancel, deleting }: Props) {
  const { t } = useLocale()
  const [confirmWord, setConfirmWord] = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState<string | null>(null)

  const wordOk    = confirmWord === CONFIRM_WORD
  const canSubmit = wordOk && !deleting

  const handleConfirm = async () => {
    setError(null)
    try {
      await onConfirm(password || undefined)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('deleteAccount.unexpectedError'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/30 p-6 space-y-5 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <h3 className="text-base font-bold text-white">{t('deleteAccount.title')}</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Consequences */}
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 space-y-2">
          <p className="text-sm font-semibold text-red-300">{t('deleteAccount.irreversible')}</p>
          <ul className="text-xs text-red-200/70 space-y-1 list-disc list-inside">
            <li>{t('deleteAccount.consequences.personalData')}</li>
            <li>{t('deleteAccount.consequences.history')}</li>
            <li>{t('deleteAccount.consequences.relationships')}</li>
            <li>{t('deleteAccount.consequences.noRecovery')}</li>
          </ul>
        </div>

        {/* Confirmation inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              {t('deleteAccount.typeToConfirmPrefix')}{' '}
              <span className="font-bold text-white font-mono">{CONFIRM_WORD}</span>{' '}
              {t('deleteAccount.typeToConfirmSuffix')}
            </label>
            <input
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value.toUpperCase())}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-red-400 transition-colors placeholder:text-zinc-600 placeholder:tracking-normal"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              {t('deleteAccount.password')}{' '}
              <span className="text-zinc-600">{t('deleteAccount.passwordHint')}</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-red-400 transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="size-4" />
          {deleting ? t('deleteAccount.deleting') : t('deleteAccount.deleteForever')}
        </button>
      </div>
    </div>
  )
}
