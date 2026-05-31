'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2, Scale } from 'lucide-react'
import { toast } from 'sonner'

/** CSV drag-or-click import for Renpho smart scales. Sends the raw CSV to the API for parsing and upsert. */
export function RenphoImport() {
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [imported, setImported] = useState(0)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setStatus('loading')
    try {
      const text = await file.text()
      const res  = await fetch('/api/user/metrics/renpho', {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    text,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Erreur import')
      setImported(data.imported)
      setStatus('success')
      toast.success(`${data.imported} mesure${data.imported > 1 ? 's' : ''} Renpho importée${data.imported > 1 ? 's' : ''}`)
    } catch (err) {
      setStatus('error')
      toast.error(err instanceof Error ? err.message : 'Fichier invalide')
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Scale className="size-4 text-[#C8F135]" />
        <h3 className="text-sm font-semibold text-white">Renpho</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-1">Importez votre export CSV depuis l&apos;app Renpho.</p>
      <p className="text-xs text-zinc-600 mb-4">
        App Renpho → Profil → ··· → Exporter les données → CSV
      </p>

      <label className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
        status === 'success' ? 'border-emerald-500/50 bg-emerald-500/5' :
        status === 'error'   ? 'border-red-500/50 bg-red-500/5' :
        status === 'loading' ? 'border-zinc-600 bg-zinc-800/50 cursor-not-allowed' :
                               'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
      }`}>
        {status === 'loading' ? (
          <Loader2 className="size-8 text-zinc-400 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle className="size-8 text-emerald-400" />
        ) : status === 'error' ? (
          <AlertCircle className="size-8 text-red-400" />
        ) : (
          <Upload className="size-8 text-zinc-500" />
        )}
        <span className="text-xs text-zinc-400">
          {status === 'loading' ? 'Import en cours…' :
           status === 'success' ? `${imported} mesure${imported > 1 ? 's' : ''} importée${imported > 1 ? 's' : ''}` :
           status === 'error'   ? 'Fichier invalide — réessayez' :
           'Glissez ou cliquez pour importer (.csv)'}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={status === 'loading'}
          onChange={handleFile}
        />
      </label>

      {status === 'success' && (
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Importer un autre fichier
        </button>
      )}
    </div>
  )
}
