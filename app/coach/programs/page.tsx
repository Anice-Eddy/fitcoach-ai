// Programmes du coach — liste mockée avec bouton de création

import { Plus, FileText, Users } from 'lucide-react'

const MOCK_PROGRAMS = [
  { id: 'p1', name: 'PPL Débutant 3j',      members: 8,  duration: '8 semaines' },
  { id: 'p2', name: 'Full Body Intermédiaire', members: 5, duration: '6 semaines' },
  { id: 'p3', name: 'Endurance Été',         members: 3,  duration: '12 semaines' },
  { id: 'p4', name: 'Force Maximale',        members: 2,  duration: '10 semaines' },
]

export default function CoachPrograms() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programmes</h1>
          <p className="text-zinc-400 text-sm mt-1">{MOCK_PROGRAMS.length} programmes actifs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors">
          <Plus className="size-4" /> Créer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_PROGRAMS.map((p) => (
          <div key={p.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <FileText className="size-5 text-[#C8F135] mb-3" />
            <h3 className="font-semibold text-white">{p.name}</h3>
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Users className="size-3.5" /> {p.members} membres</span>
              <span>{p.duration}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-sm text-amber-300">
        Éditeur de programme en développement — disponible dans l'offre entreprise.
      </div>
    </div>
  )
}
