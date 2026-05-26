'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus, X, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CoachNote {
  id: string
  title: string
  content: string
  category?: string
  createdAt: string
  updatedAt: string
}

interface CoachMember {
  id: string
  member: {
    id: string
    name: string
    email: string
    profile?: {
      firstName?: string
    }
  }
}

export default function NotesPage() {
  const [members, setMembers] = useState<CoachMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'FEEDBACK',
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (selectedMemberId) {
      fetchNotes(selectedMemberId)
    }
  }, [selectedMemberId])

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

  const fetchNotes = async (memberId: string) => {
    try {
      const res = await fetch(`/api/coach/notes?memberId=${memberId}`)
      const data = await res.json()
      setNotes(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) return

    try {
      setIsCreating(true)
      const res = await fetch('/api/coach/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          ...formData,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({
          title: '',
          content: '',
          category: 'FEEDBACK',
        })
        await fetchNotes(selectedMemberId)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedMember = members.find((m) => m.member.id === selectedMemberId)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="text-[#C8F135]" />
            Notes de suivi
          </h1>
          <p className="text-gray-400 mt-2">Écrivez des notes sur vos membres</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-8">
        {/* Sidebar: Liste des membres */}
        <div className="col-span-1">
          <div className="bg-zinc-800 rounded-lg p-4">
            <h2 className="font-semibold mb-4">Vos membres</h2>
            {isLoading ? (
              <p className="text-gray-400 text-sm">Chargement...</p>
            ) : members.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun membre suivi</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <button
                    key={m.member.id}
                    onClick={() => setSelectedMemberId(m.member.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedMemberId === m.member.id
                        ? 'bg-[#C8F135] text-zinc-900 font-medium'
                        : 'bg-zinc-700 text-white hover:bg-zinc-600'
                    }`}
                  >
                    <div className="font-medium">{m.member.name}</div>
                    <div className="text-xs opacity-75">{m.member.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content: Notes */}
        <div className="col-span-3">
          {selectedMemberId ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <button
                    onClick={() => setSelectedMemberId(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 text-sm"
                  >
                    <ArrowLeft size={16} />
                    Retour
                  </button>
                  <h2 className="text-2xl font-semibold">Notes pour {selectedMember?.member.name}</h2>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C8F135] text-zinc-900 rounded-lg hover:bg-[#b8e125] transition font-semibold"
                >
                  <Plus size={20} />
                  Nouvelle note
                </button>
              </div>

              {/* Formulaire */}
              {showForm && (
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Ajouter une note</h3>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Titre</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Ex: Progression notable"
                        required
                        className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Catégorie</label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C8F135]"
                      >
                        <option value="FEEDBACK">Retours</option>
                        <option value="WORKOUT">Entraînement</option>
                        <option value="NUTRITION">Nutrition</option>
                        <option value="PROGRESS">Progression</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Contenu</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        placeholder="Écrivez votre note..."
                        required
                        className="w-full px-3 py-2 bg-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#C8F135] h-32 resize-none"
                      />
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
                        {isCreating ? 'Création...' : 'Ajouter la note'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des notes */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="bg-zinc-800 rounded-lg p-12 text-center text-gray-400">
                    <p>Aucune note pour ce membre</p>
                    <p className="text-sm mt-2">Commencez par ajouter une nouvelle note</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{note.title}</h3>
                          {note.category && (
                            <span className="inline-block mt-2 px-2 py-1 bg-zinc-700 text-xs rounded text-gray-300">
                              {note.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {format(new Date(note.createdAt), 'PPP p', { locale: fr })}
                        </p>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-800 rounded-lg p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Sélectionnez un membre pour voir et écrire des notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
