// Shared translation keys for stable profile enum values stored in the database.
export const GENDER_LABEL_KEYS: Record<string, string> = {
  MALE:   'onboarding.identity.male',
  FEMALE: 'onboarding.identity.female',
}

export const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  SEDENTARY:         'onboarding.activityStep.levels.sedentary.label',
  LIGHTLY_ACTIVE:    'onboarding.activityStep.levels.light.label',
  MODERATELY_ACTIVE: 'onboarding.activityStep.levels.moderate.label',
  VERY_ACTIVE:       'onboarding.activityStep.levels.very.label',
  EXTREMELY_ACTIVE:  'onboarding.activityStep.levels.extreme.label',
}

export const GOAL_LABEL_KEYS: Record<string, string> = {
  WEIGHT_LOSS:     'onboarding.goalsStep.goals.weightLoss.label',
  MUSCLE_GAIN:     'onboarding.goalsStep.goals.muscleGain.label',
  MAINTENANCE:     'onboarding.goalsStep.goals.maintenance.label',
  ENDURANCE:       'onboarding.goalsStep.goals.endurance.label',
  FLEXIBILITY:     'onboarding.goalsStep.goals.flexibility.label',
  GENERAL_FITNESS: 'onboarding.goalsStep.goals.generalFitness.label',
}

export const LEVEL_LABEL_KEYS: Record<string, string> = {
  BEGINNER:     'onboarding.goalsStep.levels.beginner.label',
  INTERMEDIATE: 'onboarding.goalsStep.levels.intermediate.label',
  ADVANCED:     'onboarding.goalsStep.levels.advanced.label',
  ATHLETE:      'onboarding.goalsStep.levels.athlete.label',
}

export const EQUIPMENT_LABEL_KEYS: Record<string, string> = {
  BODYWEIGHT:      'coachMembers.equipment.bodyweight',
  DUMBBELL:        'coachMembers.equipment.dumbbell',
  KETTLEBELL:      'coachMembers.equipment.kettlebell',
  RESISTANCE_BAND: 'coachMembers.equipment.resistanceBand',
  PULL_UP_BAR:     'coachMembers.equipment.pullUpBar',
  BARBELL:         'coachMembers.equipment.barbell',
  BENCH:           'coachMembers.equipment.bench',
  CABLE_MACHINE:   'coachMembers.equipment.cableMachine',
  SMITH_MACHINE:   'coachMembers.equipment.smithMachine',
  CARDIO_MACHINE:  'coachMembers.equipment.cardioMachine',
  CHEST_PRESS_MACHINE: 'coachMembers.equipment.chestPress',
  HIP_THRUST_MACHINE:  'coachMembers.equipment.hipThrust',
}

export const MUSCLE_GROUP_LABEL_KEYS: Record<string, string> = {
  CHEST:      'training.muscleGroups.chest',
  BACK:       'training.muscleGroups.back',
  SHOULDERS:  'training.muscleGroups.shoulders',
  BICEPS:     'training.muscleGroups.biceps',
  TRICEPS:    'training.muscleGroups.triceps',
  FOREARMS:   'training.muscleGroups.forearms',
  CORE:       'training.muscleGroups.core',
  QUADS:      'training.muscleGroups.quads',
  HAMSTRINGS: 'training.muscleGroups.hamstrings',
  GLUTES:     'training.muscleGroups.glutes',
  CALVES:     'training.muscleGroups.calves',
  FULL_BODY:  'training.muscleGroups.fullBody',
  CARDIO:     'training.muscleGroups.cardio',
}
