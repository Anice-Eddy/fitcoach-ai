// Liste des membres du coach — mockée

import Link from 'next/link'
import { ChevronRight, User } from 'lucide-react'

const MOCK_MEMBERS = [
  { id: 'm1', name: 'Alice Martin',  goal: 'Prise de masse',  progress: 78, plan: 'PRO'  },
  { id: 'm2', name: 'Bob Durand',    goal: 'Perte de poids',  progress: 55, plan: 'ELITE' },
  { id: 'm3', name: 'Clara Petit',   goal: 'Endurance',       progress: 42, plan: 'PRO'  },
  { id: 'm4', name: 'David Roux',    goal: 'Fitness général', progress: 90, plan: 'FREE' },
  { id: 'm5', name: 'Emma Bernard',  goal: 'Flexibilité',     progress: 33, plan: 'PRO'  },
]

const PLAN_COLORS: Record<string, string> = {
  FREE:  'bg-zinc-700 text-zinc-300',
  PRO:   'bg-[#C8F135]/15 text-[#C8F135]',
  ELITE: 'bg-purple-500/15 text-purple-400',
}

export default function CoachMembers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Membres</h1>
        <p className="text-zinc-400 text-sm mt-1">{MOCK_MEMBERS.length} membres actifs</p>
      </div>

      <div className="space-y-2">
        {MOCK_MEMBERS.map((m) => (
          <Link
            key={m.id}
            href={`/coach/members/${m.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="size-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{m.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PLAN_COLORS[m.plan] ?? ''}`}>{m.plan}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">{m.goal}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{m.progress}%</div>
                <div className="text-xs text-zinc-500">objectif</div>
              </div>
              <ChevronRight className="size-4 text-zinc-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
