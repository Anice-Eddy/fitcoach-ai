'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, User, TrendingUp, Weight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Member {
  member: {
    id: string
    name: string
    email: string
    profile?: {
      firstName: string
      weightKg: number
      heightCm: number
      fitnessGoal: string
      fitnessLevel: string
      targetWeightKg?: number
    }
    bodyMetrics: Array<{
      date: string
      weightKg: number
    }>
  }
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-zinc-700 text-zinc-300',
  PRO: 'bg-[#C8F135]/15 text-[#C8F135]',
  ELITE: 'bg-purple-500/15 text-purple-400',
  BUSINESS: 'bg-blue-500/15 text-blue-400',
}

export default function CoachMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/coach/members')
      const data = await res.json()
      setMembers(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWeightProgress = (member: Member) => {
    if (!member.member.profile?.targetWeightKg) return null
    const current = member.member.profile.weightKg
    const target = member.member.profile.targetWeightKg
    const progress = Math.round(((current - target) / Math.abs(current - target)) * 100)
    return Math.max(0, Math.min(100, 50 + progress * 2.5))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Membres</h1>
          <p className="text-gray-400 text-sm mt-1">
            {members.length} membre{members.length !== 1 ? 's' : ''} suivi{members.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Chargement des membres...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg p-12 text-center">
          <User size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">Aucun membre suivi pour le moment</p>
          <p className="text-sm text-gray-500 mt-2">Ajoutez des membres pour commencer à les suivre</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <Link
              key={m.member.id}
              href={`/coach/members/${m.member.id}`}
              className="block p-6 rounded-2xl bg-zinc-800 border border-zinc-700 hover:border-[#C8F135] transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="size-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center flex-shrink-0">
                  <User className="size-6 text-[#C8F135]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white text-lg">{m.member.name}</span>
                    <span className="text-xs text-gray-400">{m.member.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {m.member.profile && (
                      <>
                        <div className="flex items-center gap-1">
                          <Weight size={14} />
                          {m.member.profile.weightKg.toFixed(1)} kg
                        </div>
                        <div>{m.member.profile.fitnessGoal}</div>
                        <div className="text-xs bg-zinc-700 px-2 py-0.5 rounded">
                          {m.member.profile.fitnessLevel}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex-shrink-0 w-32">
                  {m.member.profile?.targetWeightKg ? (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-300 mb-1">
                        Objectif poids
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#C8F135] transition-all"
                          style={{ width: `${calculateWeightProgress(m) || 0}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {m.member.profile.targetWeightKg.toFixed(1)} kg
                      </div>
                    </div>
                  ) : null}
                </div>

                <ChevronRight className="size-5 text-gray-600 group-hover:text-[#C8F135] transition-colors flex-shrink-0" />
              </div>

              {/* Recent metrics */}
              {m.member.bodyMetrics && m.member.bodyMetrics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      Dernière mise à jour: {format(new Date(m.member.bodyMetrics[0].date), 'PPP', {
                        locale: fr,
                      })}
                    </div>
                    <div>Poids: {m.member.bodyMetrics[0].weightKg.toFixed(1)} kg</div>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
