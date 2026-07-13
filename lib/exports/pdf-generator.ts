// PDF generator using jsPDF to export programs and profiles.
// deps: npm install jspdf

import type { UserProfile } from '@/lib/storage/StorageAdapter'
import type { WorkoutProgram } from '@/types'
import { exerciseDisplayName } from '@/lib/training/exercise-database'

type ExportLocale = 'fr' | 'en'

const PDF_COPY = {
  fr: {
    profileTitle: 'BodyOps - Profil et mesures',
    exportedOn: 'Exporté le',
    personalInformation: 'Informations personnelles',
    firstName: 'Prénom',
    age: 'Âge',
    years: 'ans',
    weight: 'Poids',
    height: 'Taille',
    goal: 'Objectif',
    level: 'Niveau',
    calculatedMetrics: 'Mesures calculées',
    recommendedCalories: 'Calories recommandées',
    protein: 'Protéines',
    carbs: 'Glucides',
    fat: 'Lipides',
    perDay: 'jour',
    program: 'Programme',
    session: 'Séance',
    reps: 'reps',
    rest: 'repos',
  },
  en: {
    profileTitle: 'BodyOps - Profile & Metrics',
    exportedOn: 'Exported on',
    personalInformation: 'Personal information',
    firstName: 'First name',
    age: 'Age',
    years: 'years',
    weight: 'Weight',
    height: 'Height',
    goal: 'Goal',
    level: 'Level',
    calculatedMetrics: 'Calculated metrics',
    recommendedCalories: 'Recommended calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    perDay: 'day',
    program: 'Program',
    session: 'Session',
    reps: 'reps',
    rest: 'rest',
  },
} as const

const PROFILE_VALUE_COPY = {
  fr: {
    goals: {
      WEIGHT_LOSS:     'Perte de poids',
      MUSCLE_GAIN:     'Prise de masse',
      MAINTENANCE:     'Maintien',
      ENDURANCE:       'Endurance',
      FLEXIBILITY:     'Souplesse',
      GENERAL_FITNESS: 'Forme générale',
    },
    levels: {
      BEGINNER:     'Débutant',
      INTERMEDIATE: 'Intermédiaire',
      ADVANCED:     'Avancé',
      ATHLETE:      'Athlète',
    },
  },
  en: {
    goals: {
      WEIGHT_LOSS:     'Weight loss',
      MUSCLE_GAIN:     'Muscle gain',
      MAINTENANCE:     'Maintenance',
      ENDURANCE:       'Endurance',
      FLEXIBILITY:     'Flexibility',
      GENERAL_FITNESS: 'General fitness',
    },
    levels: {
      BEGINNER:     'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED:     'Advanced',
      ATHLETE:      'Athlete',
    },
  },
} as const

function localizedProfileValue(locale: ExportLocale, group: 'goals' | 'levels', value?: string | null): string {
  if (!value) return '-'
  return PROFILE_VALUE_COPY[locale][group][value as keyof typeof PROFILE_VALUE_COPY[typeof locale][typeof group]] ?? value
}

/** Generates and downloads a PDF containing the user's personal info and calculated fitness metrics using jsPDF. */
export async function exportProfilePDF(profile: UserProfile, locale: ExportLocale = 'fr'): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const copy = PDF_COPY[locale]
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US'

  // Header
  doc.setFillColor(200, 241, 53)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(copy.profileTitle, 14, 14)

  doc.setTextColor(80, 80, 80)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${copy.exportedOn} ${new Date().toLocaleDateString(dateLocale)}`, 14, 28)

  let y = 40

  // Personal information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 30, 30)
  doc.text(copy.personalInformation, 14, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const info = [
    [copy.firstName, profile.firstName],
    [copy.age, `${profile.age} ${copy.years}`],
    [copy.weight, `${profile.weightKg} kg`],
    [copy.height, `${profile.heightCm} cm`],
    [copy.goal, localizedProfileValue(locale, 'goals', profile.fitnessGoal)],
    [copy.level, localizedProfileValue(locale, 'levels', profile.fitnessLevel)],
  ]
  info.forEach(([label, val]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, 14, y)
    doc.setTextColor(30, 30, 30);    doc.text(String(val), 80, y)
    y += 7
  })

  // Calculated metrics
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(copy.calculatedMetrics, 14, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const metrics = [
    ['IMC',                profile.bmi?.toFixed(1) ?? '—'],
    ['BMR',                `${Math.round(profile.bmr ?? 0)} kcal/${copy.perDay}`],
    ['TDEE',               `${Math.round(profile.tdee ?? 0)} kcal/${copy.perDay}`],
    [copy.recommendedCalories, `${Math.round(profile.recommendedCalories ?? 0)} kcal/${copy.perDay}`],
    [copy.protein,            `${Math.round(profile.recommendedProteinG ?? 0)}g/${copy.perDay}`],
    [copy.carbs,              `${Math.round(profile.recommendedCarbsG ?? 0)}g/${copy.perDay}`],
    [copy.fat,                `${Math.round(profile.recommendedFatG ?? 0)}g/${copy.perDay}`],
  ]
  metrics.forEach(([label, val]) => {
    doc.setTextColor(120, 120, 120); doc.text(label, 14, y)
    doc.setTextColor(30, 30, 30);    doc.text(String(val), 80, y)
    y += 7
  })

  doc.save(`BodyOps-profile-${profile.firstName.toLowerCase()}.pdf`)
}

/** Generates and downloads a PDF listing all sessions and exercises of the given workout program using jsPDF. */
export async function exportProgramPDF(program: WorkoutProgram, firstName: string, locale: ExportLocale = 'fr'): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const copy = PDF_COPY[locale]

  doc.setFillColor(200, 241, 53)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${copy.program} - ${program.name}`, 14, 14)

  let y = 35
  program.sessions.forEach((session, si) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${copy.session} ${si + 1}: ${session.name}`, 14, y)
    y += 8

    session.exercises.forEach((ex) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(`- ${exerciseDisplayName(ex, locale)} - ${ex.sets} x ${ex.reps} ${copy.reps} - ${copy.rest} ${ex.restSeconds}s`, 18, y)
      y += 6
    })
    y += 4
  })

  doc.save(`BodyOps-program-${firstName.toLowerCase()}.pdf`)
}
