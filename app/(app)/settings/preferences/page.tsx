'use client'

import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'

export default function PreferencesPage() {
  const { profile, updateProfile, setStorageMode, storageMode } = useUserStore()

  const setLanguage = async (language: 'fr' | 'en') => {
    updateProfile({ language })
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    }).catch(() => null)
    toast.success('Préférences mises à jour')
  }

  return (
    <>
      <Header title="Préférences" />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h1 className="text-[22px] font-medium text-white">Préférences</h1>
            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.5px] text-zinc-500">Langue</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['fr', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      aria-label={`Passer l'application en ${lang === 'fr' ? 'français' : 'anglais'}`}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        (profile?.language ?? 'fr') === lang
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {lang === 'fr' ? 'FR' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.5px] text-zinc-500">Stockage</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['local', 'cloud'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setStorageMode(mode)}
                      aria-label={`Utiliser le stockage ${mode}`}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        storageMode === mode
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {mode === 'local' ? 'Local' : 'Cloud'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
