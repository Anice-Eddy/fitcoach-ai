import { beforeEach, describe, expect, it } from 'vitest'
import { useNutritionStore } from '@/stores/nutritionStore'
import { useTrainingStore } from '@/stores/trainingStore'
import type { SessionExercise } from '@/types'

const exercise: SessionExercise = {
  id: 'ex-1',
  name: 'Développé couché',
  instructions: [],
  muscleGroups: ['CHEST'],
  equipment: ['BARBELL'],
  isCompound: true,
  order: 0,
  sets: 4,
  reps: 10,
  weightKg: 60,
  restSeconds: 90,
  isCompleted: false,
}

describe('completion toggles', () => {
  beforeEach(() => {
    useNutritionStore.setState({ todayMeals: [], activePlanId: null, isLoading: false, error: null })
    useTrainingStore.setState({
      activeProgramId: null,
      activeSession: {
        sessionId: 'session-1',
        name: 'Séance test',
        startedAt: new Date(),
        exercises: [exercise],
        currentExercise: 0,
        restTimerActive: false,
        restSecondsLeft: 0,
      },
      isLoading: false,
      error: null,
    })
  })

  it('toggles a meal from todo to done and back', () => {
    const meal = {
      mealId: 'meal-1',
      name: 'Déjeuner',
      type: 'LUNCH',
      calories: 500,
      proteinG: 40,
      carbsG: 50,
      fatG: 12,
      loggedAt: new Date().toISOString(),
    }

    useNutritionStore.getState().toggleMeal(meal)
    expect(useNutritionStore.getState().todayMeals).toHaveLength(1)

    useNutritionStore.getState().toggleMeal(meal)
    expect(useNutritionStore.getState().todayMeals).toHaveLength(0)
  })

  it('toggles an exercise from todo to done and back', () => {
    useTrainingStore.getState().toggleExercise(0, { reps: 11 })
    expect(useTrainingStore.getState().activeSession?.exercises[0].isCompleted).toBe(true)
    expect(useTrainingStore.getState().activeSession?.exercises[0].reps).toBe(11)

    useTrainingStore.getState().toggleExercise(0)
    expect(useTrainingStore.getState().activeSession?.exercises[0].isCompleted).toBe(false)
  })
})
