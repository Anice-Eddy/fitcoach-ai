'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp, Smartphone } from 'lucide-react'
import Image from 'next/image'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bodyops.app'
const WEBHOOK_URL = `${APP_URL}/api/user/metrics/apple-health`

const STEPS = [
  {
    title: '1. Copie ton token personnel',
    desc:  'Ce token identifie ta requête. Ne le partage jamais.',
  },
  {
    title: '2. Ouvre l\'app Raccourcis sur iPhone',
    desc:  'Appuie sur + (en haut à droite) pour créer un nouveau Raccourci.',
  },
  {
    title: '3. Ajoute ces actions dans l\'ordre',
    desc:  null,
    actions: [
      { label: 'Rechercher les données de santé', detail: 'Type : Masse corporelle · Limite : 1 · Trié par : Date (décroissant)' },
      { label: 'Rechercher les données de santé', detail: 'Type : Nombre de pas · Plage de dates : Hier' },
      { label: 'Rechercher les données de santé', detail: 'Type : Analyse du sommeil · Plage de dates : Hier' },
      { label: 'Créer un dictionnaire', detail: 'weightKg → Élément de santé[1] · steps → Somme(Pas) · sleepHours → Durée sommeil / 3600' },
      { label: 'Obtenir le contenu de l\'URL', detail: `URL : ${WEBHOOK_URL}\nMéthode : POST\nEn-têtes : Authorization → Bearer [colle ton token]\nCorps : JSON → dictionnaire ci-dessus` },
    ],
  },
  {
    title: '4. Automatise (optionnel)',
    desc:  'Raccourcis → Automatisation → + → Heure de la journée → Chaque jour à 7h → sélectionne ce Raccourci.',
  },
]

export function AppleHealthShortcut() {
  const [token,   setToken]   = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

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
          <p className="text-xs text-zinc-400">Synchronisation via Raccourci iOS</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8F135]/10 text-[#C8F135] font-medium">Actif</span>
      </div>

      {/* Token */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Ton token personnel</p>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5">
          <code className="flex-1 text-xs text-zinc-300 font-mono truncate">
            {loading ? 'Chargement…' : (token ?? 'Erreur')}
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
        <p className="text-xs text-zinc-600 mt-1.5">Ne partage jamais ce token — il donne accès à tes données.</p>
      </div>

      {/* Instructions toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-[#C8F135] hover:text-[#d4f54d] transition-colors"
      >
        <Smartphone className="size-4" />
        {open ? 'Masquer' : 'Voir'} les instructions de configuration
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {open && (
        <ol className="space-y-4 border-t border-zinc-800 pt-4">
          {STEPS.map((step, i) => (
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
            <p className="text-xs font-semibold text-white">5. Données synchronisées</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['Poids', 'Masse grasse', 'Pas', 'Sommeil', 'Fréquence cardiaque', 'Calories actives'].map(d => (
                <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{d}</span>
              ))}
            </div>
          </li>
        </ol>
      )}
    </div>
  )
}
