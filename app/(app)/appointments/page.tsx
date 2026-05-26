'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'

interface Appointment {
  id: string
  title: string
  scheduledAt: string
  duration: number
  status: string
  meetLink?: string | null
  coachProfile: {
    user: { id: string; name: string | null }
  }
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente',  color: 'text-amber-400 bg-amber-400/10' },
  CONFIRMED: { label: 'Confirmé',    color: 'text-emerald-400 bg-emerald-400/10' },
  COMPLETED: { label: 'Terminé',     color: 'text-zinc-400 bg-zinc-800' },
  CANCELLED: { label: 'Annulé',      color: 'text-red-400 bg-red-400/10' },
  NO_SHOW:   { label: 'Absent',      color: 'text-red-400 bg-red-400/10' },
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/appointments')
      .then(r => r.ok ? r.json() as Promise<Appointment[]> : [])
      .then(data => { setAppointments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const upcoming = appointments.filter(a => new Date(a.scheduledAt) >= new Date() && a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
  const past     = appointments.filter(a => new Date(a.scheduledAt) < new Date() || a.status === 'COMPLETED' || a.status === 'CANCELLED')

  return (
    <>
      <Header title="Mes rendez-vous" />
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-white">Mes rendez-vous</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Suivi de vos séances avec votre coach</p>
          </div>
          <Link
            href="/coaches"
            className="flex items-center gap-1.5 rounded-xl bg-[#C8F135] px-4 py-2 text-xs font-medium text-black hover:bg-[#d4f54d] transition-colors"
          >
            <Plus className="size-3.5" /> Nouveau
          </Link>
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                <Calendar className="size-7 text-zinc-600" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold">Aucun rendez-vous</p>
              <p className="text-sm text-zinc-400 mt-1">Réservez une séance avec un coach certifié.</p>
            </div>
            <Link
              href="/coaches"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C8F135] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#d4f54d] transition-colors"
            >
              Trouver un coach →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  À venir ({upcoming.length})
                </p>
                <div className="space-y-3">
                  {upcoming.map(appt => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Historique ({past.length})
                </p>
                <div className="space-y-3 opacity-70">
                  {past.map(appt => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </>
  )
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const st    = STATUS_STYLE[appt.status]
  const date  = new Date(appt.scheduledAt)
  const isPast = date < new Date()

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{appt.title}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st?.color ?? 'text-zinc-400 bg-zinc-800'}`}>
              {st?.label ?? appt.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {appt.coachProfile.user.name ?? 'Coach'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <Calendar className="size-3.5" />
          {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {appt.duration} min
        </div>
        {appt.meetLink && !isPast && (
          <a href={appt.meetLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C8F135] hover:underline ml-auto">
            Rejoindre <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}
