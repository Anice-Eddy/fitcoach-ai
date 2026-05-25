'use client'
// Import manuel des données Evolt Active — Phase 1 (CSV/JSON manuel)

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { EvoltMeasurement } from '@/lib/integrations/evolt-active'
import { normalizeEvoltData } from '@/lib/integrations/evolt-active'

interface Props {
  onImport: (data: ReturnType<typeof normalizeEvoltData>) => void
}

export function EvoltImport({ onImport }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as EvoltMeasurement
        const normalized = normalizeEvoltData(raw)
        onImport(normalized)
        setStatus('success')
        toast.success('Données Evolt importées avec succès')
      } catch {
        setStatus('error')
        toast.error('Fichier invalide — attendu : JSON Evolt Active')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Evolt Active</h3>
      <p className="text-xs text-zinc-400 mb-4">Importez votre rapport JSON depuis l&apos;app Evolt.</p>

      <label className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        status === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' :
        status === 'error'   ? 'border-red-500/50 bg-red-500/5' :
                               'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
      }`}>
        {status === 'success' ? (
          <CheckCircle className="size-8 text-emerald-400" />
        ) : status === 'error' ? (
          <AlertCircle className="size-8 text-red-400" />
        ) : (
          <Upload className="size-8 text-zinc-500" />
        )}
        <span className="text-xs text-zinc-400">
          {status === 'success' ? 'Import réussi !' : status === 'error' ? 'Fichier invalide' : 'Glissez ou cliquez pour importer'}
        </span>
        <input type="file" accept=".json" className="hidden" onChange={handleFile} />
      </label>
    </div>
  )
}
