'use client'

import { useState } from 'react'
import { Save, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Note { id: string; title: string; content: string; category?: string | null; createdAt: string }

interface Props {
  memberId: string
  initialNotes: Note[]
}

/** Inline coach-note editor: lists existing notes and provides a form to add new notes for the given member. */
export function NotesEditor({ memberId, initialNotes }: Props) {
  const [notes, setNotes]   = useState<Note[]>(initialNotes)
  const [adding, setAdding] = useState(false)
  const [form, setForm]     = useState({ title: '', content: '', category: 'PROGRESS' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/coach/notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ memberId, ...form }),
      })
      if (!res.ok) throw new Error()
      const note = await res.json() as Note
      setNotes(prev => [note, ...prev])
      setForm({ title: '', content: '', category: 'PROGRESS' })
      setAdding(false)
      toast.success('Note enregistrée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const categories = ['PROGRESS', 'FEEDBACK', 'WORKOUT', 'NUTRITION', 'OTHER']
  const categoryLabel: Record<string, string> = {
    PROGRESS: 'Progression', FEEDBACK: 'Feedback', WORKOUT: 'Entraînement',
    NUTRITION: 'Nutrition', OTHER: 'Autre',
  }
  const categoryColor: Record<string, string> = {
    PROGRESS: 'text-[#C8F135] bg-[#C8F135]/10', FEEDBACK: 'text-blue-400 bg-blue-400/10',
    WORKOUT: 'text-purple-400 bg-purple-400/10', NUTRITION: 'text-emerald-400 bg-emerald-400/10',
    OTHER: 'text-zinc-400 bg-zinc-400/10',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Notes coach (privées)</p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors"
          >
            <Plus className="size-3" /> Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Titre"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135] transition-colors"
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]"
          >
            {categories.map(c => (
              <option key={c} value={c}>{categoryLabel[c]}</option>
            ))}
          </select>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={3}
            placeholder="Contenu de la note…"
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135] resize-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C8F135] text-zinc-900 text-[10px] font-medium disabled:opacity-50"
            >
              <Save className="size-3" /> Enregistrer
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setForm({ title: '', content: '', category: 'PROGRESS' }) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-[10px] hover:text-white"
            >
              <X className="size-3" /> Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notes.length === 0 && !adding && (
          <p className="text-xs text-zinc-600 italic">Aucune note pour ce membre.</p>
        )}
        {notes.map(note => (
          <div key={note.id} className="rounded-lg bg-[#0b0d09] border border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${categoryColor[note.category ?? 'OTHER'] ?? 'text-zinc-400 bg-zinc-800'}`}>
                {categoryLabel[note.category ?? 'OTHER'] ?? note.category}
              </span>
              <span className="text-[10px] text-zinc-600">
                {new Date(note.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="text-xs font-medium text-white mb-0.5">{note.title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
