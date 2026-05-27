'use client'
// Page exports — PDF et JSON avec garde premium
import { useState, useRef } from 'react'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { useUserStore }  from '@/stores/userStore'
import { exportProfilePDF } from '@/lib/exports/pdf-generator'
import { buildJsonExport, downloadJson } from '@/lib/exports/json-exporter'
import { validateImport, readJsonFile }  from '@/lib/exports/json-importer'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import { toast } from 'sonner'
import { Download, Upload, FileJson, FileText, AlertCircle } from 'lucide-react'

/** Data export/import page: allows downloading profile as JSON or PDF, and importing a previously exported JSON file. */
export default function ExportsPage() {
  const { profile, setProfile } = useUserStore()
  const fileRef      = useRef<HTMLInputElement>(null)
  const [loading, setLoading]   = useState<string | null>(null)
  const [preview, setPreview]   = useState<unknown>(null)

  const handleExportPDF = async () => {
    if (!profile) { toast.error('Profil introuvable'); return }
    setLoading('pdf')
    try { await exportProfilePDF(profile); toast.success('PDF exporté !') }
    catch { toast.error('Erreur lors de l\'export PDF') }
    finally { setLoading(null) }
  }

  const handleExportJSON = async () => {
    setLoading('json')
    const storage = new LocalStorageAdapter()
    const metrics = await storage.getBodyMetrics(365)
    const payload = buildJsonExport(profile, metrics)
    downloadJson(payload)
    toast.success('Export JSON téléchargé !')
    setLoading(null)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const raw    = await readJsonFile(file)
    const result = validateImport(raw)
    if (!result.success) { toast.error(result.error); return }
    setPreview(result.data)
  }

  const handleImport = async () => {
    if (!preview) return
    const data = preview as { profile: unknown }
    const storage = new LocalStorageAdapter()
    if (data.profile) await storage.saveProfile(data.profile as never)
    toast.success('Données importées avec succès !')
    setPreview(null)
    window.location.reload()
  }

  const ExportCard = ({ icon: Icon, title, desc, action, id, disabled }: {
    icon: typeof Download; title: string; desc: string; action: () => void; id: string; disabled?: boolean
  }) => (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
          <Icon className="size-5 text-[#C8F135]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-400">{desc}</p>
        </div>
      </div>
      <button onClick={action} disabled={disabled || loading === id}
        className="w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold disabled:opacity-50 hover:bg-[#d4f54d] transition-colors"
      >
        {loading === id ? 'Génération…' : 'Télécharger'}
      </button>
    </div>
  )

  return (
    <>
      <Header title="Exports" />
      <PageWrapper>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ExportCard
              icon={FileText} id="pdf" title="Export PDF — Profil"
              desc="Profil, mesures, IMC, calories et macros"
              action={handleExportPDF}
            />
            <ExportCard
              icon={FileJson} id="json" title="Export JSON — Toutes données"
              desc="Profil + historique métriques (version 1.0)"
              action={handleExportJSON}
            />
          </div>

          {/* Import JSON */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Import JSON</h3>
            <p className="text-xs text-zinc-400 mb-4">Restaurez vos données depuis un export BodyOps.</p>

            {preview ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">Aperçu chargé. Confirmer pour écraser les données actuelles.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPreview(null)} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800">Annuler</button>
                  <button onClick={handleImport} className="flex-1 py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d]">Confirmer l'import</button>
                </div>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-600 hover:text-white transition-colors"
                >
                  <Upload className="size-4" /> Choisir un fichier JSON
                </button>
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
