// Profil détaillé d'un membre — données mockées

import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar, Target } from 'lucide-react'

const MOCK_DATA: Record<string, { name: string; goal: string; weight: number; targetWeight: number; sessions: number; streak: number }> = {
  m1: { name: 'Alice Martin',  goal: 'Prise de masse',  weight: 62,  targetWeight: 68,  sessions: 24, streak: 7  },
  m2: { name: 'Bob Durand',    goal: 'Perte de poids',  weight: 89,  targetWeight: 78,  sessions: 18, streak: 3  },
  m3: { name: 'Clara Petit',   goal: 'Endurance',       weight: 55,  targetWeight: 55,  sessions: 12, streak: 5  },
  m4: { name: 'David Roux',    goal: 'Fitness général', weight: 75,  targetWeight: 72,  sessions: 31, streak: 14 },
  m5: { name: 'Emma Bernard',  goal: 'Flexibilité',     weight: 58,  targetWeight: 58,  sessions: 9,  streak: 2  },
}

export default function MemberDetail({ params }: { params: { memberId: string } }) {
  const member = MOCK_DATA[params.memberId]

  if (!member) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Membre introuvable.{' '}
        <Link href="/coach/members" className="text-[#C8F135] hover:underline">Retour</Link>
      </div>
    )
  }

  const stats = [
    { label: 'Séances',     value: member.sessions, icon: Calendar   },
    { label: 'Série',       value: `${member.streak}j`, icon: TrendingUp },
    { label: 'Poids actuel',value: `${member.weight}kg`, icon: Target  },
    { label: 'Objectif',    value: `${member.targetWeight}kg`, icon: Target },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/coach/members" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="size-4" /> Retour aux membres
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{member.name}</h1>
        <p className="text-zinc-400 text-sm mt-1">{member.goal}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <s.icon className="size-4 text-[#C8F135] mb-2" />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <h2 className="font-semibold mb-3">Dernières séances</h2>
        <div className="space-y-2 text-sm text-zinc-300">
          {['Push — 45 min', 'Pull — 50 min', 'Legs — 55 min'].map((s, i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0">
              <span>{s}</span>
              <span className="text-zinc-500">il y a {i + 1}j</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
