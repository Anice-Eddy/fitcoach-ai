// Base de données d'exercices — 15 exercices réalistes avec instructions
import type { Exercise } from '@/types'

export const EXERCISE_DATABASE: Exercise[] = [
  {
    id: 'ex-bench-press', name: 'Développé couché', nameEn: 'Bench Press',
    description: 'Exercice de base pour les pectoraux.',
    instructions: ['Allongez-vous sur le banc, pieds au sol.', 'Saisissez la barre à largeur d\'épaules.', 'Descendez la barre jusqu\'à la poitrine de manière contrôlée.', 'Poussez la barre vers le haut en expirant.'],
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Bench+Press',
  },
  {
    id: 'ex-squat', name: 'Squat barre', nameEn: 'Barbell Squat',
    description: 'Le roi des exercices pour les jambes.',
    instructions: ['Placez la barre sur les trapèzes.', 'Pieds à largeur d\'épaules, orteils légèrement ouverts.', 'Descendez en gardant le dos droit et les genoux dans l\'axe des pieds.', 'Remontez en poussant à travers les talons.'],
    muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Squat',
  },
  {
    id: 'ex-deadlift', name: 'Soulevé de terre', nameEn: 'Deadlift',
    description: 'Exercice polyarticulaire complet pour le dos et les jambes.',
    instructions: ['Pieds à largeur des hanches sous la barre.', 'Saisir la barre en pronation ou mixte.', 'Dos droit, hanches fléchies, barre contre les tibias.', 'Pousser le sol et lever la barre en gardant le dos neutre.'],
    muscleGroups: ['BACK', 'HAMSTRINGS', 'GLUTES'], equipment: ['BARBELL'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Deadlift',
  },
  {
    id: 'ex-ohp', name: 'Développé militaire', nameEn: 'Overhead Press',
    description: 'Exercice de base pour les épaules.',
    instructions: ['Barre au niveau de la clavicule, prise légèrement plus large que les épaules.', 'Poussez la barre au-dessus de la tête en contractant les abdos.', 'Descendez de manière contrôlée.'],
    muscleGroups: ['SHOULDERS', 'TRICEPS'], equipment: ['BARBELL'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=OHP',
  },
  {
    id: 'ex-pull-up', name: 'Tractions', nameEn: 'Pull-up',
    description: 'Exercice au poids du corps excellent pour le dos.',
    instructions: ['Saisir la barre en supination ou pronation.', 'Partir bras tendus.', 'Tirer jusqu\'à ce que le menton passe la barre.', 'Redescendre de manière contrôlée.'],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['PULL_UP_BAR', 'BODYWEIGHT'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Pull-up',
  },
  {
    id: 'ex-row', name: 'Rowing barre', nameEn: 'Barbell Row',
    description: 'Exercice de tirage horizontal pour le dos.',
    instructions: ['Penchez-vous à 45° en gardant le dos droit.', 'Tirez la barre vers le nombril.', 'Contrôlez la descente.'],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['BARBELL'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Row',
  },
  {
    id: 'ex-dips', name: 'Dips', nameEn: 'Dips',
    description: 'Exercice de base pour les triceps et pectoraux.',
    instructions: ['Montez sur les barres parallèles bras tendus.', 'Fléchissez les coudes et descendez jusqu\'à ce que les bras soient à 90°.', 'Poussez pour remonter.'],
    muscleGroups: ['TRICEPS', 'CHEST'], equipment: ['BODYWEIGHT'], isCompound: true,
    imageUrl: 'https://via.placeholder.com/400x300?text=Dips',
  },
  {
    id: 'ex-lunges', name: 'Fentes avant', nameEn: 'Forward Lunges',
    description: 'Exercice unilatéral pour les jambes.',
    instructions: ['Debout, pieds joints.', 'Avancez un pied et fléchissez les deux genoux à 90°.', 'Le genou arrière frôle le sol.', 'Remontez et changez de jambe.'],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['BODYWEIGHT', 'DUMBBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Lunges',
  },
  {
    id: 'ex-curl', name: 'Curl haltères', nameEn: 'Dumbbell Curl',
    description: 'Isolation des biceps.',
    instructions: ['Debout, haltères en main bras le long du corps.', 'Fléchissez les coudes en tournant les paumes vers le haut.', 'Contractez les biceps en haut.', 'Redescendez lentement.'],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Curl',
  },
  {
    id: 'ex-triceps-ext', name: 'Extension triceps', nameEn: 'Triceps Extension',
    description: 'Isolation des triceps.',
    instructions: ['Assis, haltère tenu à deux mains au-dessus de la tête.', 'Fléchissez les coudes pour descendre l\'haltère derrière la nuque.', 'Étendez les bras pour remonter.'],
    muscleGroups: ['TRICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Triceps',
  },
  {
    id: 'ex-lateral-raise', name: 'Élévations latérales', nameEn: 'Lateral Raise',
    description: 'Isolation des deltoïdes latéraux.',
    instructions: ['Debout, haltères en main le long du corps.', 'Levez les bras sur les côtés jusqu\'à l\'horizontale.', 'Contrôlez la descente.'],
    muscleGroups: ['SHOULDERS'], equipment: ['DUMBBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Lateral+Raise',
  },
  {
    id: 'ex-rdl', name: 'Romanian Deadlift', nameEn: 'Romanian Deadlift',
    description: 'Isolation des ischio-jambiers.',
    instructions: ['Debout, haltères en main devant les cuisses.', 'Inclinez le buste en avant en gardant le dos droit.', 'Descendez jusqu\'à sentir l\'étirement dans les ischiojambiers.', 'Remontez en contractant les fessiers.'],
    muscleGroups: ['HAMSTRINGS', 'GLUTES'], equipment: ['DUMBBELL', 'BARBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=RDL',
  },
  {
    id: 'ex-plank', name: 'Planche', nameEn: 'Plank',
    description: 'Gainage abdominal isométrique.',
    instructions: ['En position de pompe, appuyez sur les avant-bras.', 'Corps droit de la tête aux talons.', 'Contractez les abdominaux et les fessiers.', 'Maintenez la position le temps requis.'],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Plank',
  },
  {
    id: 'ex-calf-raise', name: 'Élévations mollets', nameEn: 'Calf Raise',
    description: 'Exercice d\'isolation pour les mollets.',
    instructions: ['Debout, orteils sur une marche ou à plat.', 'Montez sur la pointe des pieds en contractant les mollets.', 'Descendez lentement sous l\'horizontale pour étirer.'],
    muscleGroups: ['CALVES'], equipment: ['BODYWEIGHT', 'DUMBBELL'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Calf+Raise',
  },
  {
    id: 'ex-face-pull', name: 'Face Pull', nameEn: 'Face Pull',
    description: 'Exercice de tirage pour les deltoïdes postérieurs et les rotateurs.',
    instructions: ['À la poulie haute, saisir la corde en pronation.', 'Tirer la corde vers le visage, coudes à la hauteur des épaules.', 'Séparer les mains en fin de mouvement.', 'Revenir de manière contrôlée.'],
    muscleGroups: ['SHOULDERS', 'BACK'], equipment: ['CABLE_MACHINE'], isCompound: false,
    imageUrl: 'https://via.placeholder.com/400x300?text=Face+Pull',
  },
]

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find((e) => e.id === id)
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISE_DATABASE.filter((e) => e.muscleGroups.includes(muscle as never))
}
