'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Appointment {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  status: string
  meetLink?: string
  member: {
    name: string
    email: string
    profile?: {
      firstName?: string
      weightKg?: number
    }
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    memberId: '',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    meetLink: '',
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/coach/appointments')
      const data = await res.json()
      setAppointments(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreating(true)
      const res = await fetch('/api/coach/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({
          memberId: '',
          title: '',
          description: '',
          scheduledAt: '',
          duration: 60,
          meetLink: '',
        })
        await fetchAppointments()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const upcomingAppointments = appointments
    .filter((a) => new Date(a.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const pastAppointments = appointments
    .filter((a) => new Date(a.scheduledAt) <= new Date())
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="text-[#C8F135]" />
            Agenda
          </h1>
          <p className="text-gray-400 mt-2">Gérez vos rendez-vous avec vos membres</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C8F135] text-zinc-900 rounded-lg hover:bg-[#b8e125] transition font-semibold"
        >
          <Plus size={20} />
          Nouveau rendez-vous
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Créer un rendez-vous</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Membre</label>
                <input
                  type="text"
                  value={formData.memberId}
                  onChange={(e) =>
                    setFormData({ ...formData, memberId: e.target.value })
                  }
                  placeholder="ID du membre"
                  required
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Session d'entraînement"
                  required
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date et heure</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Durée (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Lien de réunion (optionnel)</label>
                <input
                  type="url"
                  value={formData.meetLink}
                  onChange={(e) =>
                    setFormData({ ...formData, meetLink: e.target.value })
                  }
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Détails du rendez-vous"
                  className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135] h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-[#C8F135] text-zinc-900 rounded-lg hover:bg-[#b8e125] transition disabled:opacity-50 font-semibold"
              >
                {isCreating ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rendez-vous à venir */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-[#C8F135]" />
              À venir ({upcomingAppointments.length})
            </h2>
            {upcomingAppointments.length === 0 ? (
              <div className="bg-zinc-800 rounded-lg p-6 text-center text-gray-400">
                Aucun rendez-vous prévu
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{appt.title}</h3>
                        <p className="text-gray-400 text-sm mt-1">{appt.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appt.status === 'CONFIRMED'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {appt.status === 'CONFIRMED' ? 'Confirmé' : 'En attente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        {format(new Date(appt.scheduledAt), 'PPP p', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        {appt.member.name} ({appt.member.email})
                      </div>
                      <div className="flex items-center gap-2">
                        ⏱ {appt.duration} min
                      </div>
                    </div>

                    {appt.meetLink && (
                      <a
                        href={appt.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-[#C8F135] hover:underline text-sm"
                      >
                        Accéder à la réunion →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rendez-vous passés */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-400">Historique</h2>
              <div className="grid gap-4">
                {pastAppointments.map((appt) => (
                  <div key={appt.id} className="bg-zinc-800 bg-opacity-50 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-300">{appt.title}</h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-700 text-gray-300">
                        {appt.status === 'COMPLETED' ? 'Complété' : appt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        {format(new Date(appt.scheduledAt), 'PPP p', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        {appt.member.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
