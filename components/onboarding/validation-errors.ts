const ONBOARDING_ERROR_KEYS: Record<string, string> = {
  // These French strings mirror current validator output and must stay stable for backward-compatible translation lookup.
  'Le prénom doit contenir au moins 2 caractères': 'onboarding.validation.firstNameMin',
  'Le prénom ne peut pas dépasser 50 caractères':  'onboarding.validation.firstNameMax',
  "L'âge doit être un nombre":                     'onboarding.validation.ageNumber',
  "L'âge doit être un entier":                     'onboarding.validation.ageInteger',
  'Âge minimum : 13 ans':                          'onboarding.validation.ageMin',
  'Âge maximum : 100 ans':                         'onboarding.validation.ageMax',
  'Sélectionnez un genre':                         'onboarding.validation.genderRequired',
  'Entrez un poids valide':                        'onboarding.validation.weightNumber',
  'Poids minimum : 30 kg':                         'onboarding.validation.weightMin',
  'Poids maximum : 300 kg':                        'onboarding.validation.weightMax',
  'Entrez une taille valide':                      'onboarding.validation.heightNumber',
  'Taille minimum : 100 cm':                       'onboarding.validation.heightMin',
  'Taille maximum : 250 cm':                       'onboarding.validation.heightMax',
  "Sélectionnez un niveau d'activité":             'onboarding.validation.activityRequired',
  'Sélectionnez au moins un équipement':           'onboarding.validation.equipmentRequired',
  'Minimum 1 jour par semaine':                    'onboarding.validation.daysMin',
  'Maximum 7 jours par semaine':                   'onboarding.validation.daysMax',
  'Sélectionnez un objectif':                      'onboarding.validation.goalRequired',
  'Sélectionnez votre niveau':                     'onboarding.validation.levelRequired',
}

/** Translates known onboarding validation messages while preserving unknown backend/schema messages. */
export function translateOnboardingError(message: string | undefined, t: (key: string) => string) {
  if (!message) return ''
  const key = ONBOARDING_ERROR_KEYS[message]
  return key ? t(key) : message
}
