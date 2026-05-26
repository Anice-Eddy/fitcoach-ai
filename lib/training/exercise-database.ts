import type { Exercise } from '@/types'

// First element of muscleGroups = primary muscle (determines session placement)
export const EXERCISE_DATABASE: Exercise[] = [
  // ── CHEST ──────────────────────────────────────────────────────────────────
  {
    id: 'ex-bench-press', name: 'Développé couché',
    description: 'Exercice de base pour les pectoraux avec barre.',
    instructions: [
      'Allongez-vous sur le banc, pieds à plat sur le sol.',
      'Saisissez la barre légèrement plus large que les épaules.',
      'Descendez la barre jusqu\'à la poitrine de manière contrôlée.',
      'Poussez la barre vers le haut en expirant, bras tendus sans verrouiller les coudes.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=vcBig73ojpE',
  },
  {
    id: 'ex-incline-db-press', name: 'Développé incliné haltères',
    description: 'Travaille le haut des pectoraux et les épaules.',
    instructions: [
      'Régler le banc à 30–45°.',
      'Haltères en main à hauteur des épaules, paumes vers l\'avant.',
      'Poussez les haltères vers le haut en les rapprochant légèrement en fin de mouvement.',
      'Redescendez de façon contrôlée.',
    ],
    muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  },
  {
    id: 'ex-push-up', name: 'Pompes',
    description: 'Exercice au poids du corps pour les pectoraux.',
    instructions: [
      'Position de planche : mains à largeur d\'épaules, corps aligné.',
      'Fléchissez les coudes et abaissez la poitrine vers le sol.',
      'Poussez pour revenir à la position de départ.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  },
  {
    id: 'ex-cable-fly', name: 'Écartés à la poulie',
    description: 'Isolation des pectoraux en étirement complet.',
    instructions: [
      'Se placer entre deux poulies réglées à hauteur d\'épaule.',
      'Saisir une poignée de chaque côté, légère flexion des coudes.',
      'Ramener les mains vers le centre en arc de cercle.',
      'Contrôler le retour en maintenant la tension.',
    ],
    muscleGroups: ['CHEST'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
  },
  {
    id: 'ex-dips', name: 'Dips',
    description: 'Exercice de base pour les triceps et pectoraux aux barres parallèles.',
    instructions: [
      'Montez sur les barres parallèles bras tendus.',
      'Inclinez légèrement le torse vers l\'avant pour cibler les pectoraux.',
      'Fléchissez les coudes et descendez jusqu\'à ce que les bras soient à 90°.',
      'Poussez pour remonter.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
  },

  // ── BACK ───────────────────────────────────────────────────────────────────
  {
    id: 'ex-pull-up', name: 'Tractions',
    description: 'Exercice au poids du corps excellent pour le dos et les biceps.',
    instructions: [
      'Saisir la barre en pronation (paumes vers l\'avant), largeur d\'épaules.',
      'Partir bras tendus, épaules légèrement rétractées.',
      'Tirer jusqu\'à ce que le menton passe la barre.',
      'Redescendre de manière contrôlée en gardant la tension.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['PULL_UP_BAR', 'BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  },
  {
    id: 'ex-chin-up', name: 'Tractions supination',
    description: 'Variante en supination qui sollicite davantage les biceps.',
    instructions: [
      'Saisir la barre en supination (paumes vers vous), prise légèrement plus étroite.',
      'Partir bras tendus.',
      'Tirer en ramenant les coudes vers les hanches.',
      'Descendre lentement.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['PULL_UP_BAR', 'BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=tE_GJZSqcn0',
  },
  {
    id: 'ex-row', name: 'Rowing barre',
    description: 'Exercice de tirage horizontal pour l\'épaisseur du dos.',
    instructions: [
      'Pieds à largeur des hanches, légère flexion des genoux.',
      'Saisir la barre, incliner le torse à 45°, dos droit.',
      'Tirer la barre vers le nombril en serrant les omoplates.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
  },
  {
    id: 'ex-db-row', name: 'Rowing haltère unilatéral',
    description: 'Tirage unilatéral pour corriger les déséquilibres musculaires.',
    instructions: [
      'Appuyez un genou et une main sur le banc pour stabiliser.',
      'Saisir l\'haltère en prise neutre.',
      'Tirer l\'haltère vers la hanche en gardant le dos plat.',
      'Descendre lentement et répéter.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=pYcpY20QaE8',
  },
  {
    id: 'ex-face-pull', name: 'Face Pull',
    description: 'Exercice de tirage pour les deltoïdes postérieurs et les rotateurs externes.',
    instructions: [
      'À la poulie haute, saisir la corde en pronation.',
      'Reculer pour créer de la tension, coudes à hauteur des épaules.',
      'Tirer la corde vers le visage en écartant les mains.',
      'Revenir de manière contrôlée.',
    ],
    muscleGroups: ['BACK', 'SHOULDERS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
  },
  {
    id: 'ex-deadlift', name: 'Soulevé de terre',
    description: 'Exercice polyarticulaire complet ciblant principalement le dos.',
    instructions: [
      'Pieds à largeur des hanches sous la barre.',
      'Saisir la barre en pronation ou prise mixte, bras tendus.',
      'Dos droit, hanches fléchies, barre contre les tibias.',
      'Pousser le sol, lever la barre en gardant le dos neutre jusqu\'à la position debout.',
    ],
    muscleGroups: ['BACK', 'HAMSTRINGS', 'GLUTES'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=ytGaGIn3SjE',
  },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  {
    id: 'ex-ohp', name: 'Développé militaire',
    description: 'Exercice de base pour les deltoïdes.',
    instructions: [
      'Barre au niveau de la clavicule, prise légèrement plus large que les épaules.',
      'Contractez les abdos et fessiers pour stabiliser.',
      'Poussez la barre au-dessus de la tête, bras tendus.',
      'Descendez de manière contrôlée.',
    ],
    muscleGroups: ['SHOULDERS', 'TRICEPS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
  },
  {
    id: 'ex-lateral-raise', name: 'Élévations latérales',
    description: 'Isolation des deltoïdes latéraux.',
    instructions: [
      'Debout, haltères en main le long du corps.',
      'Levez les bras sur les côtés jusqu\'à l\'horizontale, légère flexion des coudes.',
      'Contrôlez la descente.',
    ],
    muscleGroups: ['SHOULDERS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
  },
  {
    id: 'ex-arnold-press', name: 'Arnold Press',
    description: 'Variante du développé épaules avec rotation pour couvrir les 3 chefs.',
    instructions: [
      'Assis, haltères devant le visage, paumes vers soi, coudes fléchis.',
      'Poussez les haltères vers le haut en faisant pivoter les paumes vers l\'avant.',
      'Terminé avec les bras tendus et les paumes vers l\'avant.',
      'Inversez le mouvement pour descendre.',
    ],
    muscleGroups: ['SHOULDERS', 'TRICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=vj2w851ZHRM',
  },
  {
    id: 'ex-rear-delt-fly', name: 'Oiseau (deltoïde postérieur)',
    description: 'Isolation des deltoïdes postérieurs, souvent négligés.',
    instructions: [
      'Penchez-vous à 90°, dos plat, haltères pendant.',
      'Levez les bras sur les côtés en arc de cercle jusqu\'à l\'horizontale.',
      'Serrez les omoplates en haut.',
      'Redescendez lentement.',
    ],
    muscleGroups: ['SHOULDERS', 'BACK'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=GneYaDPO11Y',
  },

  // ── BICEPS ─────────────────────────────────────────────────────────────────
  {
    id: 'ex-curl', name: 'Curl haltères',
    description: 'Exercice d\'isolation des biceps classique.',
    instructions: [
      'Debout, haltères en main, bras le long du corps, paumes vers l\'avant.',
      'Fléchissez les coudes en tournant les paumes vers le haut.',
      'Contractez les biceps en haut du mouvement.',
      'Redescendez lentement en gardant les coudes fixes.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  },
  {
    id: 'ex-barbell-curl', name: 'Curl barre',
    description: 'Curl à la barre pour une surcharge maximale des biceps.',
    instructions: [
      'Debout, barre en prise supination à largeur des épaules.',
      'Fléchissez les coudes en maintenant les coudes fixes le long du corps.',
      'Montez jusqu\'à la contraction maximale.',
      'Redescendez de façon contrôlée.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFRgfo',
  },
  {
    id: 'ex-hammer-curl', name: 'Curl marteau',
    description: 'Curl en prise neutre sollicitant le brachial et brachioradial.',
    instructions: [
      'Debout, haltères en prise neutre (pouces vers le haut).',
      'Fléchissez les coudes sans tourner les poignets.',
      'Montez jusqu\'à la contraction, redescendez lentement.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=TwD-YGVP4Bk',
  },

  // ── TRICEPS ────────────────────────────────────────────────────────────────
  {
    id: 'ex-triceps-ext', name: 'Extension triceps haltère',
    description: 'Isolation des triceps au-dessus de la tête pour l\'étirement maximal.',
    instructions: [
      'Assis, haltère tenu à deux mains au-dessus de la tête, bras tendus.',
      'Fléchissez les coudes pour descendre l\'haltère derrière la nuque.',
      'Étendez les bras pour remonter.',
      'Gardez les coudes fixes et proches de la tête.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=_gsUck-7M74',
  },
  {
    id: 'ex-triceps-pushdown', name: 'Pushdown câble',
    description: 'Isolation des triceps à la poulie.',
    instructions: [
      'À la poulie haute, saisir la barre ou corde.',
      'Coudes fixes contre le corps, avant-bras vers le bas.',
      'Pousser vers le bas jusqu\'à extension complète.',
      'Remonter de façon contrôlée.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
  },
  {
    id: 'ex-skull-crusher', name: 'Skull Crusher',
    description: 'Exercice d\'isolation efficace pour le chef long des triceps.',
    instructions: [
      'Allongé sur le banc, barre tenue à largeur d\'épaules bras tendus.',
      'Fléchissez les coudes pour descendre la barre vers le front.',
      'Étendez les bras pour remonter.',
      'Gardez les coudes fixes et pointés vers le haut.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['BARBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
  },

  // ── QUADS ──────────────────────────────────────────────────────────────────
  {
    id: 'ex-squat', name: 'Squat barre',
    description: 'Le roi des exercices pour les jambes.',
    instructions: [
      'Placez la barre sur les trapèzes.',
      'Pieds à largeur d\'épaules, orteils légèrement ouverts.',
      'Descendez en gardant le dos droit et les genoux dans l\'axe des pieds.',
      'Remontez en poussant à travers les talons.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
  },
  {
    id: 'ex-goblet-squat', name: 'Squat goblet',
    description: 'Variante du squat au kettlebell ou haltère, accessible à tous niveaux.',
    instructions: [
      'Tenir un kettlebell ou haltère contre la poitrine.',
      'Pieds légèrement plus larges que les épaules, orteils ouverts.',
      'Descendre en gardant le torse droit.',
      'Remonter en poussant à travers les talons.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['KETTLEBELL', 'DUMBBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
  },
  {
    id: 'ex-lunges', name: 'Fentes avant',
    description: 'Exercice unilatéral pour les jambes et les fessiers.',
    instructions: [
      'Debout, pieds joints.',
      'Avancez un pied et fléchissez les deux genoux à 90°.',
      'Le genou arrière frôle le sol.',
      'Remontez et changez de jambe.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['BODYWEIGHT', 'DUMBBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
  },
  {
    id: 'ex-bulgarian-split-squat', name: 'Bulgarian Split Squat',
    description: 'Squat unilatéral avancé pour un grand étirement des quadriceps.',
    instructions: [
      'Placer le pied arrière sur un banc, pied avant en avance.',
      'Descendre la hanche vers le sol, genou avant dans l\'axe du pied.',
      'Remonter en poussant à travers le talon avant.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT', 'DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
  },
  {
    id: 'ex-leg-press', name: 'Presse à cuisses',
    description: 'Machine permettant une forte charge sur les quadriceps.',
    instructions: [
      'S\'installer dans la machine, pieds à largeur d\'épaules sur la plateforme.',
      'Déverrouiller les sécurités.',
      'Descendre la plateforme jusqu\'à 90° de flexion.',
      'Pousser pour revenir sans verrouiller les genoux.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['SMITH_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  },

  // ── HAMSTRINGS ─────────────────────────────────────────────────────────────
  {
    id: 'ex-rdl', name: 'Romanian Deadlift',
    description: 'Exercice principal pour les ischio-jambiers.',
    instructions: [
      'Debout, haltères ou barre devant les cuisses.',
      'Inclinez le buste en avant en gardant le dos droit, légère flexion des genoux.',
      'Descendez jusqu\'à sentir l\'étirement dans les ischiojambiers.',
      'Remontez en contractant les fessiers.',
    ],
    muscleGroups: ['HAMSTRINGS', 'GLUTES'], equipment: ['DUMBBELL', 'BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
  },
  {
    id: 'ex-leg-curl', name: 'Leg Curl',
    description: 'Isolation des ischio-jambiers à la machine.',
    instructions: [
      'S\'installer en décubitus ventral sur la machine.',
      'Placer le rouleau juste au-dessus des talons.',
      'Fléchir les genoux pour ramener les talons vers les fessiers.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['HAMSTRINGS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
  },

  // ── GLUTES ─────────────────────────────────────────────────────────────────
  {
    id: 'ex-hip-thrust', name: 'Hip Thrust',
    description: 'Exercice le plus efficace pour le développement des fessiers.',
    instructions: [
      'Appuyer le dos contre un banc, barre ou haltère sur les hanches.',
      'Pieds à plat, à largeur d\'épaules.',
      'Pousser les hanches vers le haut en contractant les fessiers.',
      'Maintenir brièvement en haut, redescendre.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM',
  },
  {
    id: 'ex-glute-bridge', name: 'Pont fessier',
    description: 'Version au sol du hip thrust, idéale pour débutants.',
    instructions: [
      'Allongé sur le dos, genoux fléchis, pieds à plat.',
      'Pousser les hanches vers le haut en contractant les fessiers.',
      'Tenir 1–2 secondes en haut.',
      'Redescendre lentement.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E',
  },

  // ── CORE ───────────────────────────────────────────────────────────────────
  {
    id: 'ex-plank', name: 'Planche (Plank)',
    description: 'Gainage abdominal isométrique.',
    instructions: [
      'En appui sur les avant-bras et les orteils.',
      'Corps droit de la tête aux talons.',
      'Contractez les abdominaux et les fessiers.',
      'Maintenez la position le temps requis.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
  },
  {
    id: 'ex-hanging-knee-raise', name: 'Relevé de genoux suspendu',
    description: 'Exercice de gainage dynamique à la barre pour les abdominaux inférieurs.',
    instructions: [
      'Suspendez-vous à la barre les bras tendus.',
      'Contractez les abdominaux et remontez les genoux vers la poitrine.',
      'Contrôlez la descente.',
    ],
    muscleGroups: ['CORE'], equipment: ['PULL_UP_BAR'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=hdng3Nm1x_E',
  },
  {
    id: 'ex-russian-twist', name: 'Russian Twist',
    description: 'Rotation pour les obliques.',
    instructions: [
      'Assis au sol, genoux fléchis, buste incliné à 45°.',
      'Tenir un poids ou les mains jointes.',
      'Tourner le buste d\'un côté à l\'autre de façon contrôlée.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
  },
  {
    id: 'ex-crunch', name: 'Crunchs',
    description: 'Exercice de base pour les abdominaux.',
    instructions: [
      'Allongé sur le dos, genoux fléchis, mains derrière la nuque (sans tirer).',
      'Contractez les abdos pour décoller les épaules du sol.',
      'Contrôlez la descente.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
  },

  // ── CALVES ─────────────────────────────────────────────────────────────────
  {
    id: 'ex-calf-raise', name: 'Élévations mollets debout',
    description: 'Exercice d\'isolation pour les gastrocnémiens.',
    instructions: [
      'Debout, orteils sur une marche pour amplifier l\'amplitude.',
      'Montez sur la pointe des pieds en contractant les mollets.',
      'Descendez lentement sous l\'horizontale pour étirer.',
    ],
    muscleGroups: ['CALVES'], equipment: ['BODYWEIGHT', 'DUMBBELL', 'SMITH_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
  },
  {
    id: 'ex-seated-calf-raise', name: 'Élévations mollets assis',
    description: 'Cible le soléaire, sous les gastrocnémiens.',
    instructions: [
      'Assis, genoux à 90°, haltère ou poids sur les cuisses.',
      'Lever les talons en contractant les mollets.',
      'Descendre lentement.',
    ],
    muscleGroups: ['CALVES'], equipment: ['DUMBBELL', 'SMITH_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=JbyjNymZOt0',
  },
]

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find((e) => e.id === id)
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISE_DATABASE.filter((e) => e.muscleGroups.includes(muscle as never))
}
