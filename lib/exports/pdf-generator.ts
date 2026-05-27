// Générateur PDF — utilise jsPDF pour exporter programme et profil
// deps: npm install jspdf

import type { UserProfile } from '@/lib/storage/StorageAdapter'
import type { WorkoutProgram } from '@/types'

/** Generates and downloads a PDF containing the user's personal info and calculated fitness metrics using jsPDF. */
export async function exportProfilePDF(profile: UserProfile): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // En-tête
  doc.setFillColor(200, 241, 53)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BodyOps — Profil & Métriques', 14, 14)

  doc.setTextColor(80, 80, 80)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)

  let y = 40

  // Informations personnelles
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text('Informations personnelles', 14, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const info = [
    ['Prénom', profile.firstName],
    ['Âge', `${profile.age} ans`],
    ['Poids', `${profile.weightKg} kg`],
    ['Taille', `${profile.heightCm} cm`],
    ['Objectif', profile.fitnessGoal],
    ['Niveau', profile.fitnessLevel],
  ]
  info.forEach(([label, val]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, 14, y)
    doc.setTextColor(30, 30, 30);    doc.text(String(val), 80, y)
    y += 7
  })

  // Métriques calculées
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Métriques calculées', 14, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const metrics = [
    ['IMC',                profile.bmi?.toFixed(1) ?? '—'],
    ['BMR',                `${Math.round(profile.bmr ?? 0)} kcal/jour`],
    ['TDEE',               `${Math.round(profile.tdee ?? 0)} kcal/jour`],
    ['Calories recommandées', `${Math.round(profile.recommendedCalories ?? 0)} kcal/jour`],
    ['Protéines',          `${Math.round(profile.recommendedProteinG ?? 0)}g/jour`],
    ['Glucides',           `${Math.round(profile.recommendedCarbsG ?? 0)}g/jour`],
    ['Lipides',            `${Math.round(profile.recommendedFatG ?? 0)}g/jour`],
  ]
  metrics.forEach(([label, val]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, 14, y)
    doc.setTextColor(30, 30, 30);    doc.text(String(val), 80, y)
    y += 7
  })

  doc.save(`BodyOps-profil-${profile.firstName.toLowerCase()}.pdf`)
}

/** Generates and downloads a PDF listing all sessions and exercises of the given workout program using jsPDF. */
export async function exportProgramPDF(program: WorkoutProgram, firstName: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFillColor(200, 241, 53)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Programme — ${program.name}`, 14, 14)

  let y = 35
  program.sessions.forEach((session, si) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Séance ${si + 1} : ${session.name}`, 14, y)
    y += 8

    session.exercises.forEach((ex) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(`• ${ex.name}  —  ${ex.sets} × ${ex.reps} reps  —  repos ${ex.restSeconds}s`, 18, y)
      y += 6
    })
    y += 4
  })

  doc.save(`BodyOps-programme-${firstName.toLowerCase()}.pdf`)
}
