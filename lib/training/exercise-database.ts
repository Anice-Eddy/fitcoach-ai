import type { Exercise } from '@/types'
import type { Locale } from '@/lib/i18n'

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

  // ── CHEST (suite) ──────────────────────────────────────────────────────────
  {
    id: 'ex-db-bench-press', name: 'Développé couché haltères',
    description: 'Variante haltères du développé couché : amplitude plus grande, travail symétrique des deux bras.',
    instructions: [
      'Allongé sur un banc plat, haltères en main à hauteur de poitrine.',
      'Pousser les deux haltères vers le haut simultanément jusqu\'à extension.',
      'Descendre lentement en ouvrant les coudes à 45–60°.',
      'L\'amplitude est plus large qu\'avec la barre.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=QsYre__-aro',
  },
  {
    id: 'ex-db-bench-press-alt', name: 'Développé couché haltères alterné',
    description: 'Presse haltères en alternant les bras : chaque côté travaille de façon indépendante, parfait pour corriger les déséquilibres.',
    instructions: [
      'Allongé sur un banc plat, haltères des deux côtés à hauteur de poitrine.',
      'Pousser un haltère vers le haut pendant que l\'autre reste en bas.',
      'Descendre le premier haltère et pousser le second simultanément.',
      'Garder les coudes à 45° du corps, contrôler la descente.',
      'Alterner de façon fluide sans bloquer en bas.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=QsYre__-aro',
  },
  {
    id: 'ex-machine-chest-press', name: 'Développé couché machine',
    description: 'Développé guidé en machine, idéal pour isoler les pectoraux en sécurité.',
    instructions: [
      'Régler le siège pour aligner les poignées avec la poitrine.',
      'Pousser les poignées en avant jusqu\'à extension.',
      'Revenir lentement sans laisser le poids toucher les butées.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS'], equipment: ['CHEST_PRESS_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=xUm0BiZCWlQ',
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
    id: 'ex-hip-thrust-db', name: 'Hip Thrust haltères',
    description: 'Hip thrust avec haltère ou kettlebell, sans barre — accessible à domicile.',
    instructions: [
      'Appuyer le haut du dos contre un banc, haltère posé sur le bas-ventre.',
      'Pieds à plat, à largeur d\'épaules.',
      'Pousser les hanches vers le haut en contractant les fessiers.',
      'Tenir 1 seconde en haut, redescendre lentement.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=Zp26q4BY5HE',
  },
  {
    id: 'ex-hip-thrust-machine', name: 'Hip Thrust machine',
    description: 'Hip thrust guidé sur machine dédiée, charge parfaitement contrôlée.',
    instructions: [
      'S\'installer dans la machine hip thrust, dos bien calé.',
      'Ajuster la résistance et la position du coussinet sur les hanches.',
      'Pousser les hanches vers le haut jusqu\'à extension complète.',
      'Redescendre de façon contrôlée.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS'], equipment: ['HIP_THRUST_MACHINE'], isCompound: true,
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

  // ── CHEST (suite) ──────────────────────────────────────────────────────────
  {
    id: 'ex-pec-deck', name: 'Pec Deck / Butterfly machine',
    description: 'Machine d\'isolation pectoraux guidée, idéale pour finir la séance.',
    instructions: [
      'Régler les bras à hauteur de poitrine.',
      'Fermer les bras devant soi en contractant les pectoraux.',
      'Revenir lentement sans laisser les coudes partir en arrière.',
    ],
    muscleGroups: ['CHEST'], equipment: ['CHEST_PRESS_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Z57CtFmRMxA',
  },
  {
    id: 'ex-cable-crossover', name: 'Crossover câble',
    description: 'Écartés en câble pour une tension constante sur les pectoraux.',
    instructions: [
      'Se placer au centre du câble, pouliés en haut.',
      'Tirer les deux câbles vers le bas et vers l\'intérieur, mains qui se croisent.',
      'Garder une légère flexion du coude tout au long du mouvement.',
      'Remonter lentement.',
    ],
    muscleGroups: ['CHEST'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=taI4XduLpTk',
  },

  // ── BACK (suite) ───────────────────────────────────────────────────────────
  {
    id: 'ex-lat-pulldown', name: 'Tirage vertical barre (Lat Pulldown)',
    description: 'Exercice fondamental pour les grands dorsaux sur machine à câble.',
    instructions: [
      'Saisir la barre en pronation, plus large que les épaules.',
      'Tirer la barre vers le bas de la poitrine en écartant les coudes.',
      'Contracter les dorsaux en bas du mouvement.',
      'Remonter lentement jusqu\'à extension complète des bras.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['CABLE_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
  },
  {
    id: 'ex-lat-pulldown-neutral', name: 'Tirage vertical prise neutre',
    description: 'Tirage vertical avec poignée triangle pour plus de travail biceps et dorsaux internes.',
    instructions: [
      'Utiliser la poignée triangle (prise neutre).',
      'Tirer vers le bas de la poitrine, coudes près du corps.',
      'Contracter fort en bas, remonter en contrôlant.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['CABLE_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=nO1f6DJMkIY',
  },
  {
    id: 'ex-cable-row', name: 'Rowing câble assis',
    description: 'Rowing horizontal à la machine câble, excellent pour l\'épaisseur du dos.',
    instructions: [
      'Assis face à la machine, pieds sur les repose-pieds.',
      'Tirer les poignées vers le nombril en ramenant les coudes en arrière.',
      'Garder le dos droit, ne pas s\'affaisser.',
      'Revenir lentement en gardant le contrôle.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['CABLE_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
  },
  {
    id: 'ex-tbar-row', name: 'T-Bar Row',
    description: 'Rowing barre en T pour un travail intense de l\'épaisseur du dos.',
    instructions: [
      'Se positionner à cheval sur la barre, pieds de chaque côté.',
      'Saisir les poignées, dos plat, légère flexion avant.',
      'Tirer la barre vers le sternum en ramenant les coudes.',
      'Descendre lentement.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=j3Igk5nyZE4',
  },
  {
    id: 'ex-hyperextension', name: 'Hyperextension / Good morning',
    description: 'Renforcement des érecteurs du rachis, fessiers et ischio-jambiers.',
    instructions: [
      'Sur le banc à lombaires ou debout barre sur les épaules.',
      'Incliner le buste vers l\'avant en gardant le dos plat.',
      'Remonter en contractant les fessiers et le bas du dos.',
    ],
    muscleGroups: ['BACK', 'GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT', 'BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=ph3pddpKzzw',
  },

  // ── SHOULDERS (suite) ─────────────────────────────────────────────────────
  {
    id: 'ex-upright-row', name: 'Rowing menton (Upright Row)',
    description: 'Cible les trapèzes et deltoïdes latéraux.',
    instructions: [
      'Debout, saisir barre ou haltères en pronation devant les cuisses.',
      'Tirer verticalement jusqu\'au menton, coudes au-dessus des mains.',
      'Descendre lentement.',
    ],
    muscleGroups: ['SHOULDERS', 'BACK'], equipment: ['BARBELL', 'DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=amCSHA5F_5I',
  },
  {
    id: 'ex-front-raise', name: 'Élévation frontale',
    description: 'Isolation du deltoïde antérieur.',
    instructions: [
      'Debout, haltères en main devant les cuisses.',
      'Lever les bras devant soi jusqu\'à hauteur des épaules.',
      'Redescendre lentement.',
    ],
    muscleGroups: ['SHOULDERS'], equipment: ['DUMBBELL', 'BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=sOoBsL5CKUQ',
  },
  {
    id: 'ex-cable-lateral-raise', name: 'Élévations latérales câble',
    description: 'Version câble des élévations latérales : tension constante sur le deltoïde moyen.',
    instructions: [
      'Se positionner de côté à la machine câble, poignée basse.',
      'Lever le bras latéralement jusqu\'à hauteur d\'épaule.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['SHOULDERS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=PPdLtSSmUys',
  },

  // ── LEGS (suite) ──────────────────────────────────────────────────────────
  {
    id: 'ex-leg-extension', name: 'Extension jambes (Leg Extension)',
    description: 'Isolation des quadriceps sur machine.',
    instructions: [
      'S\'asseoir dans la machine, rouleau sur le bas des tibias.',
      'Étendre les jambes jusqu\'à extension complète.',
      'Maintenir 1 seconde, redescendre lentement.',
    ],
    muscleGroups: ['QUADS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
  },
  {
    id: 'ex-hack-squat', name: 'Hack Squat',
    description: 'Squat guidé en machine, accent sur les quadriceps.',
    instructions: [
      'Se positionner dans la machine, pieds à largeur d\'épaules sur la plateforme.',
      'Déverrouiller la sécurité et descendre jusqu\'à 90° de flexion.',
      'Pousser fort pour remonter.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['SMITH_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=EdtPAD2GBwg',
  },
  {
    id: 'ex-sumo-squat', name: 'Squat sumo',
    description: 'Squat écart large ciblant l\'intérieur des cuisses et les fessiers.',
    instructions: [
      'Pieds très écartés, orteils pointés vers l\'extérieur.',
      'Tenir un haltère ou kettlebell entre les jambes.',
      'Descendre en gardant le dos droit et les genoux dans l\'axe des orteils.',
      'Remonter en contractant les fessiers.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['DUMBBELL', 'KETTLEBELL', 'BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=qiLCBNKWVGU',
  },
  {
    id: 'ex-step-up', name: 'Step-up',
    description: 'Montée sur banc, exercice unilatéral pour les jambes et les fessiers.',
    instructions: [
      'Face à un banc ou box, haltères en mains.',
      'Poser un pied sur le banc et pousser pour monter.',
      'Redescendre lentement sans s\'aider de la jambe arrière.',
      'Alterner les côtés.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=dQqApCGd5Ss',
  },
  {
    id: 'ex-sumo-deadlift', name: 'Soulevé de terre sumo',
    description: 'Variante sumo du deadlift, moins de sollicitation lombaire, plus de fessiers.',
    instructions: [
      'Pieds très écartés, orteils en dehors, prise de barre en dedans.',
      'Dos plat, hanches basses, pousser les genoux dans l\'axe des orteils.',
      'Pousser sur les talons pour monter, étendre hanches et genoux simultanément.',
    ],
    muscleGroups: ['HAMSTRINGS', 'GLUTES', 'BACK'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=Ota0SqE8fgQ',
  },

  // ── GLUTES (suite) ────────────────────────────────────────────────────────
  {
    id: 'ex-cable-kickback', name: 'Kickback câble',
    description: 'Isolation des fessiers au câble avec amplitude maximale.',
    instructions: [
      'Se mettre debout face à la machine câble basse, cheville fixée à la sangle.',
      'Partir en légère flexion avant, bras sur le support.',
      'Ramener la jambe vers l\'arrière en contractant le fessier.',
      'Revenir lentement.',
    ],
    muscleGroups: ['GLUTES'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Ex5tMl7C3Ug',
  },
  {
    id: 'ex-abductor-machine', name: 'Abducteurs machine',
    description: 'Isolation des abducteurs et fessiers moyens sur machine.',
    instructions: [
      'S\'asseoir dans la machine, genoux contre les coussins.',
      'Écarter les jambes vers l\'extérieur en contractant les fessiers.',
      'Revenir lentement à la position initiale.',
    ],
    muscleGroups: ['GLUTES'], equipment: ['CHEST_PRESS_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=6yFBFoQlZ2A',
  },

  // ── BICEPS (suite) ────────────────────────────────────────────────────────
  {
    id: 'ex-preacher-curl', name: 'Curl pupitre',
    description: 'Curl sur pupitre (Scott) pour isoler les biceps sans balancement.',
    instructions: [
      'S\'installer sur le pupitre, bras sur le coussin incliné.',
      'Fléchir les coudes lentement pour monter la barre ou les haltères.',
      'Contrôler la descente jusqu\'à extension presque complète.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['BARBELL', 'DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=fIWP-FRFNU0',
  },
  {
    id: 'ex-concentration-curl', name: 'Curl concentration',
    description: 'Concentration maximale sur le biceps, un bras à la fois.',
    instructions: [
      'Assis, coude appuyé contre l\'intérieur de la cuisse.',
      'Fléchir l\'avant-bras en supinant le poignet.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=0AUGkch3tzc',
  },
  {
    id: 'ex-cable-curl', name: 'Curl câble',
    description: 'Curl au câble pour une tension constante du début à la fin.',
    instructions: [
      'Se positionner face à la poulie basse, prise de la poignée en supination.',
      'Fléchir les coudes sans bouger les épaules.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U',
  },
  {
    id: 'ex-ez-bar-curl', name: 'Curl barre EZ',
    description: 'Curl barre EZ pour réduire les contraintes sur les poignets.',
    instructions: [
      'Saisir la barre EZ sur les parties inclinées en supination.',
      'Fléchir les coudes en gardant les bras le long du corps.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=SVZrOrjfNHU',
  },

  // ── TRICEPS (suite) ───────────────────────────────────────────────────────
  {
    id: 'ex-close-grip-bench', name: 'Développé couché prise serrée',
    description: 'Variante du développé couché pour isoler les triceps.',
    instructions: [
      'Saisir la barre à largeur d\'épaules (ou moins).',
      'Descendre la barre vers la poitrine basse en gardant les coudes près du corps.',
      'Pousser fort en extension.',
    ],
    muscleGroups: ['TRICEPS', 'CHEST'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=nEF0bv2FW94',
  },
  {
    id: 'ex-overhead-triceps-cable', name: 'Extension triceps câble overhead',
    description: 'Étire la longue portion du triceps en position haute.',
    instructions: [
      'Se positionner dos à la poulie haute.',
      'Tenir la corde derrière la tête, coudes pointés vers le plafond.',
      'Étendre les avant-bras vers l\'avant, revenir lentement.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Kl-bqMz7hCU',
  },
  {
    id: 'ex-triceps-kickback', name: 'Kickback triceps',
    description: 'Isolation du triceps en extension complète.',
    instructions: [
      'En appui sur un banc, bras parallèle au sol.',
      'Étendre l\'avant-bras vers l\'arrière jusqu\'à extension complète.',
      'Revenir lentement sans que le coude ne bouge.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
  },

  // ── CORE (suite) ──────────────────────────────────────────────────────────
  {
    id: 'ex-dead-bug', name: 'Dead Bug',
    description: 'Exercice de gainage profond pour la stabilité lombaire.',
    instructions: [
      'Allongé sur le dos, bras tendus vers le plafond, genoux à 90°.',
      'Abaisser simultanément le bras droit et la jambe gauche sans toucher le sol.',
      'Revenir et alterner les côtés.',
      'Garder le bas du dos plaqué au sol.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=4XLEnwUr1d8',
  },
  {
    id: 'ex-bicycle-crunch', name: 'Crunch vélo',
    description: 'Travaille les obliques et abdominaux en rotation.',
    instructions: [
      'Allongé sur le dos, mains derrière la tête.',
      'Ramener un genou et le coude opposé simultanément.',
      'Alterner de façon contrôlée.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=9FGilxCbdz8',
  },
  {
    id: 'ex-leg-raise', name: 'Relevé de jambes allongé',
    description: 'Travaille les abdominaux inférieurs.',
    instructions: [
      'Allongé sur le dos, jambes tendues.',
      'Monter les jambes à la verticale en contractant les abdos.',
      'Descendre lentement sans toucher le sol.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
  },
  {
    id: 'ex-side-plank', name: 'Planche latérale',
    description: 'Gainage isométrique ciblant les obliques.',
    instructions: [
      'En appui sur l\'avant-bras, corps aligné de la tête aux pieds.',
      'Maintenir les hanches hautes.',
      'Tenir le temps indiqué, changer de côté.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=wqzrb67Dwf8',
  },
  {
    id: 'ex-ab-wheel', name: 'Rouleau abdominal (Ab Wheel)',
    description: 'Un des exercices abdominaux les plus efficaces.',
    instructions: [
      'À genoux, tenir le rouleau à deux mains.',
      'Dérouler lentement vers l\'avant jusqu\'à quasi-extension.',
      'Revenir en contractant les abdominaux.',
      'Garder les lombaires neutres.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=4Gg9BxXGqsA',
  },

  // ── FULL BODY ─────────────────────────────────────────────────────────────
  {
    id: 'ex-kettlebell-swing', name: 'Kettlebell Swing',
    description: 'Mouvement balistique pour la puissance des hanches, fessiers et cardio.',
    instructions: [
      'Pieds à largeur d\'épaules, kettlebell devant soi.',
      'Saisir la kettlebell et l\'amener entre les jambes (hinge hip).',
      'Propulser les hanches vers l\'avant pour faire monter la kettlebell à hauteur des yeux.',
      'Laisser retomber et répéter.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS', 'BACK'], equipment: ['KETTLEBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
  },
  {
    id: 'ex-burpee', name: 'Burpee',
    description: 'Exercice full body intense pour la cardio et la puissance.',
    instructions: [
      'Depuis debout, se baisser et poser les mains au sol.',
      'Sauter les pieds en arrière (position pompes).',
      'Faire une pompe (optionnel).',
      'Ramener les pieds et sauter vers le haut avec les bras.',
    ],
    muscleGroups: ['CARDIO', 'CHEST', 'QUADS'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=auBLPXO8Fww',
  },
  {
    id: 'ex-mountain-climber', name: 'Mountain Climbers',
    description: 'Cardio intense en position de gainage : core et endurance.',
    instructions: [
      'En position de pompe, corps en ligne droite.',
      'Alterner rapidement en ramenant chaque genou vers la poitrine.',
      'Garder les hanches basses, pas de balancement.',
    ],
    muscleGroups: ['CARDIO', 'CORE'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=kLh-uczlPLg',
  },
  {
    id: 'ex-jump-rope', name: 'Corde à sauter',
    description: 'Cardio classique excellent pour la coordination et la combustion calorique.',
    instructions: [
      'Tenir les poignées à hauteur de hanche, coudes près du corps.',
      'Sauter légèrement sur la plante des pieds.',
      'Tourner la corde avec les poignets (pas les bras).',
      'Commencer 30 sec, progresser jusqu\'à 5–10 min sans arrêt.',
    ],
    muscleGroups: ['CARDIO', 'CALVES'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=1BZM2Vre5oc',
  },

  // ── CARDIO ─────────────────────────────────────────────────────────────────
  {
    id: 'ex-hiit', name: 'HIIT',
    description: 'Entraînement par intervalles haute intensité : alternance sprint/récupération.',
    instructions: [
      'Échauffement 3–5 min à intensité modérée.',
      'Sprint 20–40 sec à effort maximal.',
      'Recovery active 40–60 sec (marche ou trot).',
      'Répéter 8–12 cycles selon le niveau.',
      'Retour au calme 3–5 min.',
    ],
    muscleGroups: ['CARDIO'], equipment: ['BODYWEIGHT', 'CARDIO_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
  },
  {
    id: 'ex-treadmill-12-3-30', name: 'Tapis 12-3-30',
    description: 'Protocole viral : inclinaison 12 %, vitesse 3 mph, 30 minutes — brûle des graisses efficacement.',
    instructions: [
      'Régler le tapis : inclinaison 12 %, vitesse 4,8 km/h (3 mph).',
      'Marcher sans s\'appuyer sur les rampes.',
      'Maintenir pendant 30 minutes à ce rythme.',
      'Ne pas diminuer l\'inclinaison — c\'est la clé du protocole.',
    ],
    muscleGroups: ['CARDIO', 'GLUTES', 'HAMSTRINGS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=oCWFNdO1LWw',
  },
  {
    id: 'ex-incline-walk', name: 'Marche inclinée',
    description: 'Marche sur tapis à pente élevée pour brûler des calories sans impact articulaire.',
    instructions: [
      'Régler l\'inclinaison entre 8 et 15 %.',
      'Choisir une vitesse confortable (4–6 km/h).',
      'Garder le dos droit, ne pas s\'appuyer sur les rampes.',
      'Maintenir 20–45 minutes selon l\'objectif.',
    ],
    muscleGroups: ['CARDIO', 'GLUTES', 'CALVES'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=ldJOH-5f9LQ',
  },
  {
    id: 'ex-cycling', name: 'Vélo / Cycling',
    description: 'Cardio low-impact sur vélo statique ou home trainer, idéal pour la récupération active.',
    instructions: [
      'Régler la selle à hauteur de hanche.',
      'Pédaler à cadence régulière (70–100 rpm).',
      'Ajuster la résistance selon l\'intensité souhaitée.',
      'Viser 20–60 min selon l\'objectif.',
    ],
    muscleGroups: ['CARDIO', 'QUADS', 'HAMSTRINGS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=9L2b2khySLE',
  },
  {
    id: 'ex-running', name: 'Running extérieur',
    description: 'Course à pied en extérieur, exercice cardio complet à impact modéré.',
    instructions: [
      'Échauffement 5 min en marchant vite.',
      'Courir à une allure permettant de tenir une conversation (zone 2).',
      'Maintenir la posture : dos droit, regard vers l\'avant.',
      'Retour au calme 5 min en marchant.',
    ],
    muscleGroups: ['CARDIO', 'QUADS', 'HAMSTRINGS', 'CALVES'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=brFHyOtTwH4',
  },
  {
    id: 'ex-rowing', name: 'Rameur',
    description: 'Exercice cardio complet sollicitant 86 % des groupes musculaires, idéal pour brûler des calories.',
    instructions: [
      'S\'asseoir sur le siège, pieds calés dans les repose-pieds.',
      'Tirer la rame vers le bas-ventre en s\'allongeant.',
      'Repousser avec les jambes d\'abord, puis tirer avec les bras.',
      'Viser 20–40 min à intensité modérée ou faire des intervalles.',
    ],
    muscleGroups: ['CARDIO', 'BACK', 'QUADS', 'CORE'], equipment: ['CARDIO_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=H0r_HNxe-Cc',
  },

  // --- CHEST: advanced variations ------------------------------------------
  {
    id: 'ex-decline-bench-press', name: 'Développé décliné barre',
    description: 'Développé couché sur banc décliné ciblant le bas des pectoraux.',
    instructions: [
      'S\'installer sur le banc décliné, pieds calés dans les supports.',
      'Descendre la barre jusqu\'au bas de la poitrine.',
      'Pousser en extension complète.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=LfyQBUKR8SE',
  },
  {
    id: 'ex-incline-bench-press', name: 'Développé incliné barre',
    description: 'Développé sur banc incliné à 30–45°, cible le haut des pectoraux.',
    instructions: [
      'Régler le banc à 30–45°.',
      'Descendre la barre jusqu\'au haut de la poitrine.',
      'Pousser vers le haut et légèrement en arrière.',
    ],
    muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS'], equipment: ['BARBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=IP4oeKh1Sd4',
  },
  {
    id: 'ex-decline-db-press', name: 'Développé décliné haltères',
    description: 'Développé décliné aux haltères pour l\'amplitude maximale sur le bas des pectoraux.',
    instructions: [
      'S\'installer sur banc décliné, haltères en main.',
      'Descendre les haltères de chaque côté de la poitrine basse.',
      'Pousser les haltères vers le haut en contractant les pectoraux.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=4M0UzRaMU8k',
  },
  {
    id: 'ex-db-fly', name: 'Écartés haltères couché',
    description: 'Mouvement d\'isolation par excellence pour les pectoraux.',
    instructions: [
      'Allongé sur le banc plat, haltères à bout de bras au-dessus de la poitrine.',
      'Ouvrir les bras en arc de cercle jusqu\'à ressentir l\'étirement.',
      'Ramener les haltères en contractant les pectoraux.',
      'Garder une légère flexion du coude tout au long du mouvement.',
    ],
    muscleGroups: ['CHEST'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0',
  },
  {
    id: 'ex-incline-db-fly', name: 'Écartés inclinés haltères',
    description: 'Écartés sur banc incliné pour cibler le haut des pectoraux.',
    instructions: [
      'Banc incliné à 30–45°.',
      'Ouvrir les bras en arc jusqu\'à l\'étirement du haut des pectoraux.',
      'Ramener les haltères en contractant.',
    ],
    muscleGroups: ['CHEST', 'SHOULDERS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=AoqRTb9u2rE',
  },
  {
    id: 'ex-high-to-low-cable-fly', name: 'Câble fly haute poulie',
    description: 'Câble en croix de la poulie haute vers le bas, cible le bas des pectoraux.',
    instructions: [
      'Se placer au centre, poulies hautes.',
      'Tirer les câbles vers le bas et vers l\'intérieur en arc de cercle.',
      'Les mains se croisent légèrement devant le bassin.',
      'Remonter lentement.',
    ],
    muscleGroups: ['CHEST'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
  },
  {
    id: 'ex-low-to-high-cable-fly', name: 'Câble fly basse poulie',
    description: 'Câble de la poulie basse vers le haut, cible le haut des pectoraux.',
    instructions: [
      'Se placer au centre, poulies basses.',
      'Tirer les câbles vers le haut et vers l\'intérieur.',
      'Les mains se rejoignent en hauteur.',
    ],
    muscleGroups: ['CHEST'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Way1FqBjxdg',
  },
  {
    id: 'ex-diamond-push-up', name: 'Pompes diamant',
    description: 'Pompes prise serrée, charge maximale sur les triceps et partie interne des pectoraux.',
    instructions: [
      'Poser les mains au sol en formant un losange avec les pouces et index.',
      'Descendre le buste en gardant les coudes serrés.',
      'Pousser en extension complète.',
    ],
    muscleGroups: ['CHEST', 'TRICEPS'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=J0DnG1_S92I',
  },
  {
    id: 'ex-pullover', name: 'Pull-over haltère',
    description: 'Étirement des pectoraux et dorsaux en même temps, grand dentelé inclus.',
    instructions: [
      'Allongé perpendiculairement au banc, dos sur le banc, pieds au sol.',
      'Tenir l\'haltère à deux mains au-dessus de la poitrine, bras légèrement fléchis.',
      'Descendre l\'haltère en arc derrière la tête jusqu\'à l\'étirement.',
      'Revenir à la position initiale.',
    ],
    muscleGroups: ['CHEST', 'BACK'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=0g5HCsFotS8',
  },

  // --- BACK: advanced variations -------------------------------------------
  {
    id: 'ex-shrug-barbell', name: 'Shrug barre',
    description: 'Exercice de référence pour les trapèzes supérieurs.',
    instructions: [
      'Debout, barre en pronation devant les cuisses.',
      'Hausser les épaules le plus haut possible, sans tourner.',
      'Tenir 1 seconde en haut, descendre lentement.',
    ],
    muscleGroups: ['BACK', 'SHOULDERS'], equipment: ['BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=g6qbq4Lf1FI',
  },
  {
    id: 'ex-shrug-dumbbell', name: 'Shrug haltères',
    description: 'Shrug aux haltères pour plus d\'amplitude latérale.',
    instructions: [
      'Debout, haltères de chaque côté.',
      'Hausser les épaules en contractant les trapèzes.',
      'Tenir 1 seconde, descendre.',
    ],
    muscleGroups: ['BACK', 'SHOULDERS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=aFgCBMx0-gI',
  },
  {
    id: 'ex-rack-pull', name: 'Rack Pull',
    description: 'Soulevé de terre partiel depuis la cage, permet des charges maximales pour le dos.',
    instructions: [
      'Régler les butées de la cage à mi-cuisse.',
      'Saisir la barre en pronation, dos plat.',
      'Tirer la barre en extension complète des hanches.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BACK', 'GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=P2MJoGD1T40',
  },
  {
    id: 'ex-underhand-row', name: 'Rowing barre prise inversée',
    description: 'Rowing penché en supination, recrutement plus important des biceps et dorsaux inférieurs.',
    instructions: [
      'Penché à 45°, barre en supination (paumes vers le haut).',
      'Tirer la barre vers le nombril en gardant les coudes près du corps.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=kBWAon7ItDw',
  },
  {
    id: 'ex-chest-supported-row', name: 'Rowing poitrine appuyée',
    description: 'Rowing incliné avec poitrine appuyée sur un banc incliné : isole le dos sans solliciter les lombaires.',
    instructions: [
      'S\'allonger face contre un banc incliné à 30–45°.',
      'Laisser les haltères pendre en bas.',
      'Tirer les haltères vers les hanches en rétractant les omoplates.',
      'Descendre lentement.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=xQNrFHEMhI4',
  },
  {
    id: 'ex-weighted-pull-up', name: 'Tractions lestées',
    description: 'Tractions avec ceinture de lest pour progresser au-delà du poids de corps.',
    instructions: [
      'Fixer un disque ou un kettlebell à la ceinture de lest.',
      'Effectuer les tractions normalement, dos bien contracté.',
      'Ne pas balancer les jambes.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['PULL_UP_BAR', 'BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=V7dLgCjSgLk',
  },
  {
    id: 'ex-superman', name: 'Superman (extension dorsale sol)',
    description: 'Exercice au sol pour les érecteurs du rachis et le bas du dos.',
    instructions: [
      'Allongé face au sol, bras devant.',
      'Lever simultanément les bras, la poitrine et les jambes.',
      'Contracter les fessiers et les lombaires.',
      'Tenir 2 secondes, redescendre.',
    ],
    muscleGroups: ['BACK', 'GLUTES'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=z6PJMT2y8GQ',
  },
  {
    id: 'ex-close-grip-pulldown', name: 'Tirage vertical prise serrée',
    description: 'Tirage vertical prise étroite en supination pour le bas des dorsaux.',
    instructions: [
      'Saisir la barre en supination, mains proches l\'une de l\'autre.',
      'Tirer vers la poitrine en rentrant les coudes.',
      'Remonter lentement.',
    ],
    muscleGroups: ['BACK', 'BICEPS'], equipment: ['CABLE_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=mW_JoUEbDH0',
  },

  // --- SHOULDERS: advanced variations --------------------------------------
  {
    id: 'ex-seated-db-press', name: 'Développé épaules haltères assis',
    description: 'Développé militaire assis aux haltères, amplitude maximale.',
    instructions: [
      'Assis sur un banc, dos droit, haltères à hauteur d\'épaules.',
      'Pousser les haltères vers le haut jusqu\'à extension (sans verrouiller).',
      'Revenir lentement à hauteur d\'épaules.',
    ],
    muscleGroups: ['SHOULDERS', 'TRICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
  },
  {
    id: 'ex-reverse-pec-deck', name: 'Pec Deck inversé (deltoïdes postérieurs)',
    description: 'Machine en position inversée pour cibler les deltoïdes postérieurs.',
    instructions: [
      'S\'asseoir face au dossier de la machine Pec Deck.',
      'Attraper les poignées, coudes légèrement fléchis.',
      'Ouvrir les bras en arrière en contractant les deltoïdes postérieurs.',
      'Revenir lentement.',
    ],
    muscleGroups: ['SHOULDERS', 'BACK'], equipment: ['CHEST_PRESS_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Bwv55P2LoI8',
  },
  {
    id: 'ex-landmine-press', name: 'Landmine Press',
    description: 'Presse avec barre fixée au sol en angle, idéale pour les épaules douloureuses.',
    instructions: [
      'Fixer une extrémité de la barre au sol ou dans un support.',
      'Tenir l\'autre extrémité à hauteur d\'épaule, un genou au sol.',
      'Pousser en arc vers le haut.',
      'Revenir lentement.',
    ],
    muscleGroups: ['SHOULDERS', 'CHEST', 'TRICEPS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=6N8rVKFWHJI',
  },
  {
    id: 'ex-ytw', name: 'Y-T-W (Élastique / sol)',
    description: 'Exercice de mobilité et stabilité pour les épaules, rotateurs et rhomboïdes.',
    instructions: [
      'Allongé face au sol ou debout penché, élastique en mains.',
      'Former un Y : lever les bras en V au-dessus de la tête.',
      'Former un T : ouvrir les bras perpendiculairement au corps.',
      'Former un W : coudes fléchis, mains à hauteur d\'oreilles.',
    ],
    muscleGroups: ['SHOULDERS', 'BACK'], equipment: ['RESISTANCE_BAND', 'BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=bYRXQE_dq5g',
  },

  // --- BICEPS: advanced variations -----------------------------------------
  {
    id: 'ex-incline-db-curl', name: 'Curl haltères incliné',
    description: 'Curl sur banc incliné : étirement maximal du biceps en bas du mouvement.',
    instructions: [
      'Assis sur banc incliné à 45–60°, bras qui pendent.',
      'Fléchir lentement en supinant le poignet.',
      'Contrôler la descente jusqu\'à extension complète.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=soxrZlIl35U',
  },
  {
    id: 'ex-reverse-curl', name: 'Curl inversé (Reverse Curl)',
    description: 'Curl en pronation pour les brachio-radiaux et avant-bras.',
    instructions: [
      'Saisir la barre ou les haltères en pronation (paumes vers le bas).',
      'Fléchir sans changer la position des poignets.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['BICEPS', 'FOREARMS'], equipment: ['BARBELL', 'DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=nZiYRMbRFck',
  },
  {
    id: 'ex-zottman-curl', name: 'Zottman Curl',
    description: 'Combinaison curl + reverse curl en un seul mouvement : biceps et avant-bras.',
    instructions: [
      'Monter en supination (paumes vers le haut).',
      'En haut, pivoter les poignets en pronation.',
      'Descendre en pronation.',
      'Repivot en supination en bas.',
    ],
    muscleGroups: ['BICEPS', 'FOREARMS'], equipment: ['DUMBBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=ZrTDs5fJq2Q',
  },
  {
    id: 'ex-spider-curl', name: 'Spider Curl',
    description: 'Curl sur banc incliné face vers le bas : pic du biceps maximal.',
    instructions: [
      'S\'allonger face au sol sur un banc incliné.',
      'Laisser les bras pendre, haltères en main.',
      'Fléchir lentement, contrôler la descente.',
    ],
    muscleGroups: ['BICEPS'], equipment: ['DUMBBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=GlUMCuB0XJ8',
  },

  // --- TRICEPS: advanced variations ----------------------------------------
  {
    id: 'ex-triceps-rope-pushdown', name: 'Pushdown câble avec corde',
    description: 'Pushdown avec corde : rotation des poignets en bas pour activer les 3 chefs.',
    instructions: [
      'Saisir la corde à deux mains, poulie haute.',
      'Tirer vers le bas en séparant la corde en fin de mouvement.',
      'Rotation des poignets vers l\'extérieur pour maximiser la contraction.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
  },
  {
    id: 'ex-ez-skull-crusher', name: 'Skull Crusher barre EZ',
    description: 'Skull crusher avec barre EZ : moins de contraintes sur les poignets.',
    instructions: [
      'Allongé sur le banc, barre EZ à bout de bras au-dessus de la poitrine.',
      'Fléchir uniquement les coudes pour descendre la barre vers le front.',
      'Étendre en contractant les triceps.',
    ],
    muscleGroups: ['TRICEPS'], equipment: ['BARBELL', 'BENCH'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=NIyoCzNxRFQ',
  },
  {
    id: 'ex-bench-dip', name: 'Dips sur banc',
    description: 'Dips au poids du corps sur un banc, idéal pour débutants.',
    instructions: [
      'Mains sur le bord du banc, jambes tendues devant.',
      'Descendre en fléchissant les coudes jusqu\'à 90°.',
      'Remonter en extension.',
    ],
    muscleGroups: ['TRICEPS', 'CHEST'], equipment: ['BENCH', 'BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=0326dy_-CzM',
  },

  // --- LEGS: advanced variations -------------------------------------------
  {
    id: 'ex-reverse-lunge', name: 'Fentes arrière',
    description: 'Fentes en reculant, moins d\'impact sur les genoux que les fentes avant.',
    instructions: [
      'Debout, faire un grand pas en arrière.',
      'Descendre le genou arrière jusqu\'à 2 cm du sol.',
      'Pousser sur le pied avant pour revenir.',
      'Alterner les côtés.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT', 'DUMBBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=xrjMX8grXQs',
  },
  {
    id: 'ex-walking-lunge', name: 'Fentes marchées',
    description: 'Fentes en marche avant pour développer les jambes et la coordination.',
    instructions: [
      'Faire un grand pas en avant en descendant le genou arrière près du sol.',
      'Se relever et avancer avec l\'autre jambe.',
      'Maintenir le buste droit tout au long du parcours.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT', 'DUMBBELL', 'BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
  },
  {
    id: 'ex-lateral-lunge', name: 'Fentes latérales',
    description: 'Fentes sur le côté pour les adducteurs et le côté interne des cuisses.',
    instructions: [
      'Faire un grand pas latéral, pied d\'appui tourné légèrement vers l\'extérieur.',
      'Plier le genou de la jambe d\'appui, jambe opposée tendue.',
      'Pousser pour revenir au centre.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['BODYWEIGHT', 'DUMBBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=gwWv7aPcD88',
  },
  {
    id: 'ex-box-jump', name: 'Box Jump',
    description: 'Saut sur boîte pliométrique pour la puissance explosive des jambes.',
    instructions: [
      'Se placer à 30–50 cm de la boîte, pieds à largeur d\'épaules.',
      'Fléchir les genoux puis sauter en balançant les bras.',
      'Atterrir en douceur avec les genoux fléchis.',
      'Descendre en marchant (ne pas sauter en arrière).',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'CARDIO'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=52r_Ul5k03g',
  },
  {
    id: 'ex-jump-squat', name: 'Squat sauté',
    description: 'Squat explosif avec saut pour développer la puissance et brûler des calories.',
    instructions: [
      'Effectuer un squat jusqu\'à 90°.',
      'Exploser vers le haut en sautant le plus haut possible.',
      'Atterrir en douceur en amortissant avec les jambes.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'CARDIO'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=YfP4MnFGFHE',
  },
  {
    id: 'ex-wall-sit', name: 'Chaise (Wall Sit)',
    description: 'Isométrique pour les quadriceps, excellent pour l\'endurance musculaire.',
    instructions: [
      'Dos contre le mur, descendre jusqu\'à 90° de flexion des genoux.',
      'Pieds à largeur d\'épaules, à plat sur le sol.',
      'Tenir la position le temps imparti.',
    ],
    muscleGroups: ['QUADS'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=-cdph8hv0O0',
  },
  {
    id: 'ex-nordic-curl', name: 'Nordic Curl',
    description: 'Exercice excentrique intense pour les ischio-jambiers, prévient les blessures.',
    instructions: [
      'À genoux, chevilles maintenues par un partenaire ou un support.',
      'Descendre lentement vers le sol en retenant avec les ischio-jambiers.',
      'Se pousser avec les mains pour remonter si nécessaire.',
    ],
    muscleGroups: ['HAMSTRINGS'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=d8oBFGMEMkI',
  },
  {
    id: 'ex-single-leg-press', name: 'Presse unilatérale',
    description: 'Presse à cuisses sur une jambe pour corriger les déséquilibres.',
    instructions: [
      'Placer un seul pied au centre de la plateforme.',
      'Déverrouiller et descendre jusqu\'à 90°.',
      'Pousser en extension sans verrouiller le genou.',
    ],
    muscleGroups: ['QUADS', 'GLUTES'], equipment: ['SMITH_MACHINE'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
  },
  {
    id: 'ex-hip-adduction', name: 'Adducteurs machine',
    description: 'Machine d\'adduction pour l\'intérieur des cuisses.',
    instructions: [
      'S\'asseoir dans la machine, genoux sur les coussins écartés.',
      'Fermer les jambes en contractant les adducteurs.',
      'Revenir lentement.',
    ],
    muscleGroups: ['QUADS'], equipment: ['CHEST_PRESS_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=I8vAJMoB-HU',
  },
  {
    id: 'ex-seated-leg-curl', name: 'Leg Curl assis',
    description: 'Curl ischio-jambiers sur machine assise, étirement plus grand qu\'en décubitus.',
    instructions: [
      'S\'installer dans la machine assise, rouleau sous les chevilles.',
      'Fléchir les genoux jusqu\'à 90° ou plus.',
      'Contrôler la remontée.',
    ],
    muscleGroups: ['HAMSTRINGS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=p5qhKUYOYL8',
  },
  {
    id: 'ex-glute-ham-raise', name: 'Glute Ham Raise (GHR)',
    description: 'Exercice complet pour les ischio-jambiers et les fessiers sur machine GHR.',
    instructions: [
      'S\'installer sur la machine GHR, cuisses sur le coussin.',
      'Descendre en avant en maintenant le dos droit.',
      'Remonter en contractant les ischio-jambiers et les fessiers.',
    ],
    muscleGroups: ['HAMSTRINGS', 'GLUTES', 'BACK'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=Q_o4nBXXHAA',
  },

  // --- GLUTES: advanced variations -----------------------------------------
  {
    id: 'ex-single-leg-hip-thrust', name: 'Hip Thrust unilatéral',
    description: 'Hip thrust sur une jambe pour corriger les asymétries et intensifier le travail.',
    instructions: [
      'Dos contre le banc, un pied au sol, autre jambe tendue.',
      'Pousser la hanche vers le haut sur une seule jambe.',
      'Contracter le fessier de la jambe d\'appui.',
    ],
    muscleGroups: ['GLUTES', 'HAMSTRINGS'], equipment: ['BENCH', 'BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=FVzDSMSSBtE',
  },
  {
    id: 'ex-frog-pump', name: 'Frog Pump',
    description: 'Ponts fessiers avec pieds joints en grenouille, activation intense des fessiers.',
    instructions: [
      'Allongé sur le dos, plantes des pieds l\'une contre l\'autre, genoux ouverts.',
      'Pousser les hanches vers le haut en contractant fort les fessiers.',
      'Tenir 1 seconde en haut.',
    ],
    muscleGroups: ['GLUTES'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=7ZMhNJBWH8w',
  },
  {
    id: 'ex-side-lying-abduction', name: 'Abduction latérale couchée',
    description: 'Exercice allongé sur le côté pour les abducteurs et le fessier moyen.',
    instructions: [
      'Allongé sur le côté, corps aligné.',
      'Lever la jambe du dessus vers le plafond.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['GLUTES'], equipment: ['BODYWEIGHT', 'RESISTANCE_BAND'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Oy0J4CEXC64',
  },
  {
    id: 'ex-cable-glute-kickback', name: 'Kickback fessier debout (câble)',
    description: 'Extension de hanche au câble en position debout, isolation maximale du grand fessier.',
    instructions: [
      'Face à la machine câble basse, sangle à la cheville.',
      'Garder le buste légèrement incliné, hanche stable.',
      'Pousser la jambe vers l\'arrière en contractant le fessier.',
    ],
    muscleGroups: ['GLUTES'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=ExCKub9ibdg',
  },

  // --- CORE: advanced variations -------------------------------------------
  {
    id: 'ex-pallof-press', name: 'Pallof Press (anti-rotation)',
    description: 'Exercice anti-rotation pour renforcer la stabilité du tronc.',
    instructions: [
      'Se placer de côté à la machine câble, poignée à hauteur de poitrine.',
      'Pousser les mains devant soi en gardant le buste stable.',
      'Ne pas laisser le câble faire tourner les hanches.',
      'Revenir lentement.',
    ],
    muscleGroups: ['CORE'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=AH_QZLm_0-s',
  },
  {
    id: 'ex-cable-crunch', name: 'Crunch câble',
    description: 'Crunch avec résistance du câble pour des abdominaux plus sollicités.',
    instructions: [
      'À genoux face à la poulie haute, corde derrière la tête.',
      'Fléchir la colonne vers le bas en contractant les abdos.',
      'Revenir lentement sans étendre complètement.',
    ],
    muscleGroups: ['CORE'], equipment: ['CABLE_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=AV5Ph5kK25w',
  },
  {
    id: 'ex-hanging-leg-raise', name: 'Relevé de jambes tendu (suspendu)',
    description: 'Version avancée du relevé de genoux : jambes tendues pour les abdominaux inférieurs.',
    instructions: [
      'Suspendu à la barre.',
      'Lever les jambes tendues jusqu\'à l\'horizontale ou au-delà.',
      'Contrôler la descente sans balancer.',
    ],
    muscleGroups: ['CORE'], equipment: ['PULL_UP_BAR'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=hdng3Nm1x_E',
  },
  {
    id: 'ex-hollow-body', name: 'Hollow Body Hold',
    description: 'Position isométrique gymnique qui renforce toute la chaîne antérieure.',
    instructions: [
      'Allongé sur le dos, bras tendus derrière la tête.',
      'Lever légèrement les épaules et les jambes tendues.',
      'Creuser le ventre et tenir la position en respirant.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=BcC8e7QRj1g',
  },
  {
    id: 'ex-dragon-flag', name: 'Dragon Flag',
    description: 'Exercice iconique de Bruce Lee : contrôle total du corps en gainage dynamique.',
    instructions: [
      'Allongé sur un banc, attraper le banc derrière la tête.',
      'Lever le corps à la verticale en gardant le corps rigide.',
      'Descendre lentement en gardant la ligne droite.',
    ],
    muscleGroups: ['CORE'], equipment: ['BENCH', 'BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=ID1dMJyHHKw',
  },
  {
    id: 'ex-l-sit', name: 'L-Sit',
    description: 'Position isométrique avancée : corps en L, bras tendus, jambes à l\'horizontale.',
    instructions: [
      'Assis au sol, mains de chaque côté des hanches.',
      'Pousser pour décoller les fessiers du sol.',
      'Tendre les jambes à l\'horizontale.',
      'Tenir le plus longtemps possible.',
    ],
    muscleGroups: ['CORE', 'TRICEPS'], equipment: ['BODYWEIGHT'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=IUZJoSP66HI',
  },
  {
    id: 'ex-oblique-crunch', name: 'Crunch oblique',
    description: 'Rotation du tronc pour cibler les obliques.',
    instructions: [
      'Allongé, genoux fléchis, mains derrière la nuque.',
      'Porter l\'épaule droite vers le genou gauche.',
      'Alterner de façon contrôlée.',
    ],
    muscleGroups: ['CORE'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
  },

  // ── FOREARMS ──────────────────────────────────────────────────────────────
  {
    id: 'ex-wrist-curl', name: 'Curl de poignets',
    description: 'Flexion des poignets pour les fléchisseurs des avant-bras.',
    instructions: [
      'Avant-bras posés sur les cuisses, paumes vers le haut.',
      'Fléchir les poignets en levant les haltères ou la barre.',
      'Descendre lentement.',
    ],
    muscleGroups: ['FOREARMS'], equipment: ['DUMBBELL', 'BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=J3l6iJe4x4I',
  },
  {
    id: 'ex-reverse-wrist-curl', name: 'Curl de poignets inversé',
    description: 'Extension des poignets pour les extenseurs des avant-bras.',
    instructions: [
      'Avant-bras posés sur les cuisses, paumes vers le bas.',
      'Lever les mains vers le haut.',
      'Contrôler la descente.',
    ],
    muscleGroups: ['FOREARMS'], equipment: ['DUMBBELL', 'BARBELL'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=g9G5EZZ4lUQ',
  },
  {
    id: 'ex-farmers-walk', name: 'Farmer\'s Walk',
    description: 'Marche avec charges lourdes : grip, avant-bras, trapèzes, core.',
    instructions: [
      'Saisir deux haltères lourds ou des poignées de farmer\'s walk.',
      'Marcher sur une distance définie en maintenant le dos droit.',
      'Pas rapides et contrôlés, tête haute.',
    ],
    muscleGroups: ['FOREARMS', 'BACK', 'CORE'], equipment: ['DUMBBELL', 'KETTLEBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=rt17lmnaLSM',
  },

  // ── CALVES — variantes ─────────────────────────────────────────────────────
  {
    id: 'ex-leg-press-calf-raise', name: 'Élévation mollets à la presse',
    description: 'Mollets sur presse à cuisses : grande amplitude et charges plus lourdes.',
    instructions: [
      'Sur la presse, placer seulement la pointe des pieds sur le bas de la plateforme.',
      'Déverrouiller, fléchir les chevilles pour descendre.',
      'Monter sur la pointe des pieds, tenir 1 seconde.',
    ],
    muscleGroups: ['CALVES'], equipment: ['SMITH_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=Ij4aH6wJPLo',
  },
  {
    id: 'ex-single-leg-calf-raise', name: 'Élévation mollet unilatérale',
    description: 'Mollet sur une seule jambe avec poids du corps : charge doublée, équilibre requis.',
    instructions: [
      'Se tenir sur un pied sur le bord d\'une marche.',
      'Monter sur la pointe du pied en contractant le mollet.',
      'Descendre sous l\'horizontale pour l\'étirement.',
    ],
    muscleGroups: ['CALVES'], equipment: ['BODYWEIGHT'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=8zqFUPPIQ0c',
  },

  // ── CARDIO — variantes ─────────────────────────────────────────────────────
  {
    id: 'ex-elliptical', name: 'Elliptique',
    description: 'Cardio low-impact sur elliptique, préserve les articulations.',
    instructions: [
      'Monter sur l\'elliptique, saisir les poignées.',
      'Pédaler en synchronisant bras et jambes.',
      'Maintenir une cadence régulière (60–80 rpm).',
      'Viser 20–45 min selon l\'objectif.',
    ],
    muscleGroups: ['CARDIO', 'QUADS', 'GLUTES'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=kN0PaW8YGFA',
  },
  {
    id: 'ex-stair-climber', name: 'Stepper / Escalier',
    description: 'Montée d\'escalier sur machine ou réelle : cardio intense + fessiers.',
    instructions: [
      'Monter sur le stepper, saisir légèrement les rampes.',
      'Monter les marches à cadence régulière.',
      'Ne pas s\'appuyer sur les rampes.',
      'Viser 15–30 min.',
    ],
    muscleGroups: ['CARDIO', 'GLUTES', 'QUADS'], equipment: ['CARDIO_MACHINE'], isCompound: false,
    videoUrl: 'https://www.youtube.com/watch?v=dv_5VJHHC1M',
  },
  {
    id: 'ex-power-clean', name: 'Power Clean',
    description: 'Mouvement olympique full body pour la puissance et l\'explosivité.',
    instructions: [
      'Barre au sol, dos plat, hanches basses.',
      'Tirer la barre en extension complète des hanches et sur la pointe des pieds.',
      'Soulever les épaules puis attraper en position frontale.',
      'Absorber la réception en fléchissant légèrement les genoux.',
    ],
    muscleGroups: ['BACK', 'QUADS', 'GLUTES', 'SHOULDERS'], equipment: ['BARBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=F8xH5b1OyXs',
  },
  {
    id: 'ex-thruster', name: 'Thruster',
    description: 'Enchaînement squat frontal + développé militaire en un seul mouvement.',
    instructions: [
      'Tenir la barre ou les haltères en position frontale.',
      'Descendre en squat.',
      'Exploser vers le haut et pousser les bras en extension.',
      'Revenir en position squat et répéter.',
    ],
    muscleGroups: ['QUADS', 'GLUTES', 'SHOULDERS', 'CORE'], equipment: ['BARBELL', 'DUMBBELL', 'KETTLEBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=L219ltL15zk',
  },
  {
    id: 'ex-turkish-get-up', name: 'Turkish Get-Up',
    description: 'Mouvement complet de sol à debout : mobilité, stabilité et force fonctionnelle.',
    instructions: [
      'Allongé sur le dos, un kettlebell à bout de bras.',
      'Se lever progressivement en gardant le bras tendu.',
      'Enchaîner les étapes : coude, main, genou, debout.',
      'Refaire en sens inverse.',
    ],
    muscleGroups: ['CORE', 'SHOULDERS', 'GLUTES'], equipment: ['KETTLEBELL'], isCompound: true,
    videoUrl: 'https://www.youtube.com/watch?v=0bWRPC49-KI',
  },
]

const EXERCISE_NAME_EN: Record<string, string> = {
  'ex-bench-press': 'Barbell bench press',
  'ex-incline-db-press': 'Incline dumbbell press',
  'ex-push-up': 'Push-ups',
  'ex-cable-fly': 'Cable fly',
  'ex-dips': 'Dips',
  'ex-pull-up': 'Pull-ups',
  'ex-chin-up': 'Chin-ups',
  'ex-row': 'Barbell row',
  'ex-db-row': 'Single-arm dumbbell row',
  'ex-face-pull': 'Face pull',
  'ex-deadlift': 'Deadlift',
  'ex-ohp': 'Overhead press',
  'ex-lateral-raise': 'Lateral raises',
  'ex-arnold-press': 'Arnold press',
  'ex-rear-delt-fly': 'Rear delt fly',
  'ex-curl': 'Dumbbell curl',
  'ex-barbell-curl': 'Barbell curl',
  'ex-hammer-curl': 'Hammer curl',
  'ex-triceps-ext': 'Dumbbell triceps extension',
  'ex-triceps-pushdown': 'Cable triceps pushdown',
  'ex-skull-crusher': 'Skull crusher',
  'ex-squat': 'Barbell squat',
  'ex-goblet-squat': 'Goblet squat',
  'ex-lunges': 'Forward lunges',
  'ex-bulgarian-split-squat': 'Bulgarian split squat',
  'ex-leg-press': 'Leg press',
  'ex-rdl': 'Romanian deadlift',
  'ex-leg-curl': 'Leg curl',
  'ex-db-bench-press': 'Dumbbell bench press',
  'ex-db-bench-press-alt': 'Alternating dumbbell bench press',
  'ex-machine-chest-press': 'Machine chest press',
  'ex-hip-thrust': 'Hip thrust',
  'ex-hip-thrust-db': 'Dumbbell hip thrust',
  'ex-hip-thrust-machine': 'Machine hip thrust',
  'ex-glute-bridge': 'Glute bridge',
  'ex-plank': 'Plank',
  'ex-hanging-knee-raise': 'Hanging knee raise',
  'ex-russian-twist': 'Russian twist',
  'ex-crunch': 'Crunches',
  'ex-calf-raise': 'Standing calf raise',
  'ex-seated-calf-raise': 'Seated calf raise',
  'ex-pec-deck': 'Pec deck / butterfly machine',
  'ex-cable-crossover': 'Cable crossover',
  'ex-lat-pulldown': 'Lat pulldown',
  'ex-lat-pulldown-neutral': 'Neutral-grip lat pulldown',
  'ex-cable-row': 'Seated cable row',
  'ex-tbar-row': 'T-bar row',
  'ex-hyperextension': 'Hyperextension / good morning',
  'ex-upright-row': 'Upright row',
  'ex-front-raise': 'Front raise',
  'ex-cable-lateral-raise': 'Cable lateral raise',
  'ex-leg-extension': 'Leg extension',
  'ex-hack-squat': 'Hack squat',
  'ex-sumo-squat': 'Sumo squat',
  'ex-step-up': 'Step-up',
  'ex-sumo-deadlift': 'Sumo deadlift',
  'ex-cable-kickback': 'Cable kickback',
  'ex-abductor-machine': 'Abductor machine',
  'ex-preacher-curl': 'Preacher curl',
  'ex-concentration-curl': 'Concentration curl',
  'ex-cable-curl': 'Cable curl',
  'ex-ez-bar-curl': 'EZ-bar curl',
  'ex-close-grip-bench': 'Close-grip bench press',
  'ex-overhead-triceps-cable': 'Overhead cable triceps extension',
  'ex-triceps-kickback': 'Triceps kickback',
  'ex-dead-bug': 'Dead bug',
  'ex-bicycle-crunch': 'Bicycle crunch',
  'ex-leg-raise': 'Lying leg raise',
  'ex-side-plank': 'Side plank',
  'ex-ab-wheel': 'Ab wheel rollout',
  'ex-kettlebell-swing': 'Kettlebell swing',
  'ex-burpee': 'Burpee',
  'ex-mountain-climber': 'Mountain climbers',
  'ex-jump-rope': 'Jump rope',
  'ex-hiit': 'HIIT',
  'ex-treadmill-12-3-30': 'Treadmill 12-3-30',
  'ex-incline-walk': 'Incline walk',
  'ex-cycling': 'Cycling',
  'ex-running': 'Outdoor running',
  'ex-rowing': 'Rowing machine',
  'ex-decline-bench-press': 'Decline barbell bench press',
  'ex-incline-bench-press': 'Incline barbell bench press',
  'ex-decline-db-press': 'Decline dumbbell press',
  'ex-db-fly': 'Dumbbell fly',
  'ex-incline-db-fly': 'Incline dumbbell fly',
  'ex-high-to-low-cable-fly': 'High-to-low cable fly',
  'ex-low-to-high-cable-fly': 'Low-to-high cable fly',
  'ex-diamond-push-up': 'Diamond push-ups',
  'ex-pullover': 'Dumbbell pullover',
  'ex-shrug-dumbbell': 'Dumbbell shrug',
  'ex-underhand-row': 'Underhand barbell row',
  'ex-chest-supported-row': 'Chest-supported row',
  'ex-weighted-pull-up': 'Weighted pull-ups',
  'ex-close-grip-pulldown': 'Close-grip lat pulldown',
  'ex-seated-db-press': 'Seated dumbbell shoulder press',
  'ex-reverse-pec-deck': 'Reverse pec deck',
  'ex-ytw': 'Y-T-W raise',
  'ex-incline-db-curl': 'Incline dumbbell curl',
  'ex-reverse-curl': 'Reverse curl',
  'ex-triceps-rope-pushdown': 'Rope triceps pushdown',
  'ex-reverse-lunge': 'Reverse lunge',
  'ex-walking-lunge': 'Walking lunges',
  'ex-lateral-lunge': 'Lateral lunge',
  'ex-jump-squat': 'Jump squat',
  'ex-single-leg-press': 'Single-leg leg press',
  'ex-single-leg-hip-thrust': 'Single-leg hip thrust',
  'ex-side-lying-abduction': 'Side-lying hip abduction',
  'ex-cable-glute-kickback': 'Cable glute kickback',
  'ex-cable-crunch': 'Cable crunch',
  'ex-hanging-leg-raise': 'Hanging straight-leg raise',
  'ex-wrist-curl': 'Wrist curl',
  'ex-reverse-wrist-curl': 'Reverse wrist curl',
  'ex-leg-press-calf-raise': 'Leg press calf raise',
  'ex-single-leg-calf-raise': 'Single-leg calf raise',
}

const GENERIC_INSTRUCTIONS_EN = [
  'Set up with a stable position and keep control before starting.',
  'Move through a comfortable range of motion with steady tempo.',
  'Keep the target muscles engaged and avoid rushing the eccentric phase.',
  'Stop the set if technique breaks down or pain appears.',
]

const EXERCISE_DESCRIPTION_EN: Record<string, string> = {
  'ex-bench-press': 'Compound barbell press for chest, shoulders, and triceps.',
  'ex-incline-db-press': 'Dumbbell press emphasizing the upper chest and shoulders.',
  'ex-push-up': 'Bodyweight chest exercise that also trains shoulders and triceps.',
  'ex-cable-fly': 'Cable isolation movement that keeps constant tension on the chest.',
  'ex-dips': 'Bodyweight pressing movement for chest and triceps.',
  'ex-pull-up': 'Bodyweight vertical pull for back and biceps.',
  'ex-deadlift': 'Full-body hinge movement focused on posterior-chain strength.',
  'ex-squat': 'Compound lower-body lift for quads, glutes, and core stability.',
  'ex-hip-thrust': 'Glute-focused hip extension movement.',
  'ex-plank': 'Isometric core stability exercise.',
}

const EXERCISE_INSTRUCTIONS_EN: Record<string, string[]> = {
  'ex-bench-press': [
    'Lie on the bench with your feet flat on the floor.',
    'Grip the bar slightly wider than shoulder width.',
    'Lower the bar under control until it reaches your chest.',
    'Press the bar up while exhaling, keeping the elbows controlled.',
  ],
  'ex-squat': [
    'Set the bar securely on your upper back and brace your core.',
    'Descend by bending hips and knees while keeping your chest proud.',
    'Reach a controlled depth without losing balance.',
    'Drive through the floor to stand back up.',
  ],
  'ex-deadlift': [
    'Stand close to the bar with your mid-foot under it.',
    'Hinge at the hips, grip the bar, and brace your core.',
    'Push the floor away while keeping the bar close to your legs.',
    'Lock out with hips and knees extended, then lower under control.',
  ],
  'ex-push-up': [
    'Start in a plank with hands around shoulder width.',
    'Lower your chest toward the floor while keeping your body aligned.',
    'Press back up without letting your hips sag.',
  ],
  'ex-pull-up': [
    'Hang from the bar with a firm grip.',
    'Pull your chest toward the bar by driving elbows down.',
    'Lower under control until the arms are extended.',
  ],
}

/** Returns a localized exercise label while preserving the stored exercise name. */
export function exerciseDisplayName(exerciseOrName: Exercise | string, locale: Locale = 'fr'): string {
  const exercise = typeof exerciseOrName === 'string'
    ? EXERCISE_DATABASE.find((item) => item.id === exerciseOrName || item.name === exerciseOrName)
    : exerciseOrName
  if (!exercise) return String(exerciseOrName)
  return locale === 'en' ? (exercise.nameEn ?? EXERCISE_NAME_EN[exercise.id] ?? exercise.name) : exercise.name
}

/** Returns localized exercise instructions; English falls back to safe generic technique cues instead of French text. */
export function exerciseDisplayInstructions(exercise: Exercise, locale: Locale = 'fr'): string[] {
  if (locale !== 'en') return exercise.instructions
  return exercise.instructionsEn?.length
    ? exercise.instructionsEn
    : EXERCISE_INSTRUCTIONS_EN[exercise.id] ?? GENERIC_INSTRUCTIONS_EN
}

/** Returns a localized exercise description without exposing French copy in English mode. */
export function exerciseDisplayDescription(exercise: Exercise, locale: Locale = 'fr'): string | undefined {
  if (locale !== 'en') return exercise.description
  return exercise.descriptionEn ?? EXERCISE_DESCRIPTION_EN[exercise.id]
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_DATABASE.find((e) => e.id === id)
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  return EXERCISE_DATABASE.filter((e) => e.muscleGroups.includes(muscle as never))
}
