import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectLocale, getMessages, resolveLocaleFromLanguages, translate } from '@/lib/i18n'
import { PLANS } from '@/lib/stripe/plans'

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return prefix ? [prefix] : []
  return Object.entries(value).flatMap(([key, nested]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return flattenKeys(nested, nextPrefix)
  })
}

function flattenLeaves(value: unknown, prefix = ''): Array<[string, unknown]> {
  if (Array.isArray(value)) {
    return value.flatMap((nested, index) => flattenLeaves(nested, prefix ? `${prefix}.${index}` : String(index)))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      return flattenLeaves(nested, nextPrefix)
    })
  }
  return [[prefix, value]]
}

describe('i18n helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves a translated key in French and English', () => {
    expect(translate(getMessages('fr'), 'settings.language')).toBe('Langue')
    expect(translate(getMessages('en'), 'settings.language')).toBe('Language')
  })

  it('returns the key when a translation is missing', () => {
    expect(translate(getMessages('fr'), 'missing.translation')).toBe('missing.translation')
  })

  it('prefers the locally stored language', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'en'),
    })
    vi.stubGlobal('navigator', { language: 'fr-CA', languages: ['fr-CA'] })

    expect(detectLocale()).toBe('en')
  })

  it('detects French from the browser when no local preference exists', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
    })
    vi.stubGlobal('navigator', { language: 'fr-CA', languages: ['fr-CA', 'en-US'] })

    expect(detectLocale()).toBe('fr')
  })

  it('falls back to browser detection when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('localStorage unavailable')
      }),
    })
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] })

    expect(detectLocale()).toBe('en')
  })

  it('detects English from the browser when no local preference exists', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
    })
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US', 'fr-CA'] })

    expect(detectLocale()).toBe('en')
  })

  it('resolves Accept-Language with server-side q-values', () => {
    expect(resolveLocaleFromLanguages('en-US,en;q=0.9,fr;q=0.8')).toBe('en')
    expect(resolveLocaleFromLanguages('en-US;q=0.7,fr-CA;q=0.9')).toBe('fr')
  })

  it('falls back to French when no supported language is present', () => {
    expect(resolveLocaleFromLanguages('es-ES,es;q=0.9')).toBe('fr')
    expect(resolveLocaleFromLanguages(null)).toBe('fr')
  })

  it('keeps French and English message catalogs structurally aligned', () => {
    const frKeys = flattenKeys(getMessages('fr')).sort()
    const enKeys = flattenKeys(getMessages('en')).sort()

    expect(enKeys).toEqual(frKeys)
  })

  it('does not contain empty translations or unresolved translation-key values', () => {
    for (const locale of ['fr', 'en'] as const) {
      for (const [key, value] of flattenLeaves(getMessages(locale))) {
        expect(typeof value, `${locale}:${key}`).toBe('string')
        expect((value as string).trim(), `${locale}:${key}`).not.toBe('')
        expect(value, `${locale}:${key}`).not.toBe(key)
        expect(/^[a-z]+(\.[a-zA-Z0-9_-]+)+$/.test(value as string), `${locale}:${key}`).toBe(false)
      }
    }
  })

  it('resolves dynamic UI translation keys used by components', () => {
    const locales = ['fr', 'en'] as const
    const staticDynamicKeys = [
      ...['fr', 'en'].map(option => `languageToggle.options.${option}`),
      ...['units', 'identity', 'measurements', 'activity', 'goals', 'health', 'diet', 'summary'].flatMap(step => [
        `onboarding.stepsMeta.${step}.title`,
        `onboarding.stepsMeta.${step}.description`,
      ]),
      ...['supplements', 'equipment', 'clothing', 'books'].map(category => `shop.categories.${category}`),
      ...['identity', 'body', 'goals', 'health', 'nutrition', 'login'].flatMap(row => [
        `privacy.rows.${row}.category`,
        `privacy.rows.${row}.data`,
        `privacy.rows.${row}.purpose`,
      ]),
      'privacy.sections.who.title',
      'privacy.sections.who.body',
      'privacy.sections.data.title',
      'privacy.sections.data.intro',
      'privacy.sections.legalBasis.title',
      'privacy.sections.legalBasis.intro',
      'privacy.sections.legalBasis.consent',
      'privacy.sections.legalBasis.contract',
      'privacy.sections.legalBasis.legitimate',
      ...['retention', 'sharing', 'rights', 'security', 'cookies', 'contact'].flatMap(section => [
        `privacy.sections.${section}.title`,
        `privacy.sections.${section}.body`,
      ]),
      ...['service', 'warning', 'account', 'intellectualProperty', 'liability', 'changes', 'contact'].flatMap(section => [
        `terms.sections.${section}.title`,
        `terms.sections.${section}.body`,
      ]),
      ...['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => `nutrition.days.${day}`),
      ...['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy', 'other'].map(category => `nutrition.categories.${category}`),
      ...['vegetarian', 'vegan', 'glutenFree', 'lactoseFree', 'halal', 'kosher', 'nutFree', 'porkFree'].map(option => `onboarding.diet.restrictionsOptions.${option}`),
      ...['whiteMeat', 'fish', 'eggs', 'legumes', 'rice', 'pasta', 'potatoes', 'greenVegetables', 'fruits', 'dairy'].map(option => `onboarding.diet.preferencesOptions.${option}`),
      ...[
        'leftShoulder',
        'rightShoulder',
        'leftElbow',
        'rightElbow',
        'leftWrist',
        'rightWrist',
        'upperBack',
        'lowerBack',
        'neck',
        'leftKnee',
        'rightKnee',
        'leftAnkle',
        'rightAnkle',
        'leftHip',
        'rightHip',
        'leftQuadriceps',
        'rightQuadriceps',
        'leftHamstring',
        'rightHamstring',
        'leftCalf',
        'rightCalf',
        'chest',
        'abs',
      ].map(part => `onboarding.health.bodyParts.${part}`),
      ...['mild', 'moderate', 'severe'].map(severity => `onboarding.health.severityLabels.${severity}`),
      ...['homeBodyweight', 'homeGear', 'gym', 'outdoor'].flatMap(place => [
        `onboarding.activityStep.places.${place}.label`,
        `onboarding.activityStep.places.${place}.description`,
      ]),
      ...['sedentary', 'light', 'moderate', 'very', 'extreme'].flatMap(level => [
        `onboarding.activityStep.levels.${level}.label`,
        `onboarding.activityStep.levels.${level}.description`,
      ]),
      ...['weightLoss', 'muscleGain', 'maintenance', 'endurance', 'generalFitness', 'flexibility'].flatMap(goal => [
        `onboarding.goalsStep.goals.${goal}.label`,
        `onboarding.goalsStep.goals.${goal}.description`,
      ]),
      ...['beginner', 'intermediate', 'advanced', 'athlete'].flatMap(level => [
        `onboarding.goalsStep.levels.${level}.label`,
        `onboarding.goalsStep.levels.${level}.description`,
      ]),
      ...[
        'strengthPowerlifting',
        'hypertrophy',
        'weightLoss',
        'cardioEndurance',
        'sportsNutrition',
        'rehabilitation',
        'crossfit',
        'running',
        'yogaFlexibility',
        'boxingMartialArts',
        'swimming',
        'athleticPreparation',
      ].map(specialty => `auth.register.coach.specialtyOptions.${specialty}`),
      ...['federalDiploma', 'certifiedSportsNutrition'].map(certification => `auth.register.coach.certificationOptions.${certification}`),
      ...[
        'france',
        'canada',
        'belgium',
        'switzerland',
        'luxembourg',
        'morocco',
        'algeria',
        'tunisia',
        'senegal',
        'ivoryCoast',
        'madagascar',
        'cameroon',
        'unitedStates',
        'unitedKingdom',
        'spain',
        'italy',
        'germany',
        'portugal',
        'netherlands',
        'australia',
        'newZealand',
        'other',
      ].map(country => `coachSettings.countries.${country}`),
      ...Array.from({ length: 7 }, (_, index) => `coachAppointments.daysShort.${index}`),
      ...Array.from({ length: 7 }, (_, index) => `coachAppointments.daysFull.${index}`),
      ...['members', 'appointments', 'sessions', 'notifications'].map(stat => `coachDashboard.stats.${stat}`),
      ...['beginner', 'intermediate', 'advanced', 'athlete'].map(level => `dashboard.fitnessLevels.${level}`),
      ...['consistency', 'lowConsistency', 'sessions', 'inactivity', 'weighIn', 'missingWeighIn', 'nutrition', 'stagnation', 'progression'].map(label => `aiAssistant.insights.labels.${label}`),
      ...['noneRecorded', 'noMeasurement', 'noActivePlan', 'activePlan', 'stableWeight', 'daysWithoutTraining'].map(value => `aiAssistant.insights.values.${value}`),
      ...['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'fullBody', 'cardio'].map(group => `training.muscleGroups.${group}`),
    ]

    for (const locale of locales) {
      const messages = getMessages(locale)
      for (const key of staticDynamicKeys) {
        expect(translate(messages, key), `${locale}:${key}`).not.toBe(key)
      }
    }
  })

  it('resolves dynamic pricing and notification translation keys', () => {
    const locales = ['fr', 'en'] as const
    const notificationTypes = [
      'coachNoteReply',
      'memberNoteReply',
      'sharedNote',
      'appointmentConfirmed',
      'appointmentProposal',
      'coachAppointmentNote',
      'memberAppointmentNote',
      'newAppointment',
      'appointmentRequest',
      'newMember',
    ]
    const messageOnlyNotifications = ['coachMessage', 'memberMessage']

    for (const locale of locales) {
      const messages = getMessages(locale)
      for (const plan of PLANS) {
        expect(translate(messages, `pricing.plans.${plan.id}.name`), `${locale}:${plan.id}:name`).not.toBe(`pricing.plans.${plan.id}.name`)
        expect(translate(messages, `pricing.plans.${plan.id}.description`), `${locale}:${plan.id}:description`).not.toBe(`pricing.plans.${plan.id}.description`)
        plan.features.forEach((_, index) => {
          const key = `pricing.plans.${plan.id}.features.${index}`
          expect(translate(messages, key), `${locale}:${key}`).not.toBe(key)
        })
      }

      for (const type of notificationTypes) {
        for (const suffix of ['title', 'message', 'messageGeneric']) {
          const key = `notifications.types.${type}.${suffix}`
          expect(translate(messages, key), `${locale}:${key}`).not.toBe(key)
        }
      }

      for (const type of messageOnlyNotifications) {
        const key = `notifications.types.${type}.title`
        expect(translate(messages, key), `${locale}:${key}`).not.toBe(key)
      }
    }
  })
})
