import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { InsightCards, MemoryStrip } from '@/components/ai/InsightCards'
import type { Insight, InsightMemory } from '@/app/api/ai/insights/route'

const insights: Insight[] = [
  { type: 'alert', label: 'Low consistency', value: '42%' },
  { type: 'warning', label: 'Inactivity', value: '12d without training' },
  { type: 'info', label: 'Sessions', value: 'None recorded' },
  { type: 'success', label: 'Nutrition', value: 'Active plan' },
]

function renderCards(locale: 'fr' | 'en') {
  localStorage.setItem('bodyops:locale', locale)
  return render(
    React.createElement(
      LocaleProvider,
      {
        initialLocale: locale,
        children: React.createElement(InsightCards, { insights }),
      },
    ),
  )
}

function renderMemory(locale: 'fr' | 'en', memory: InsightMemory) {
  localStorage.setItem('bodyops:locale', locale)
  return render(
    React.createElement(
      LocaleProvider,
      {
        initialLocale: locale,
        children: React.createElement(MemoryStrip, { memory }),
      },
    ),
  )
}

describe('InsightCards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localizes API insight labels and values in French', () => {
    renderCards('fr')

    expect(screen.getByText('Régularité faible')).toBeInTheDocument()
    expect(screen.getByText('Inactivité')).toBeInTheDocument()
    expect(screen.getByText('12 j sans entraînement')).toBeInTheDocument()
    expect(screen.getByText('Aucune enregistrée')).toBeInTheDocument()
    expect(screen.getByText('Plan actif')).toBeInTheDocument()
  })

  it('keeps English labels and values in English', () => {
    renderCards('en')

    expect(screen.getByText('Low consistency')).toBeInTheDocument()
    expect(screen.getByText('12d without training')).toBeInTheDocument()
    expect(screen.getByText('None recorded')).toBeInTheDocument()
    expect(screen.getByText('Active plan')).toBeInTheDocument()
  })

  it('formats memory dates with the active locale', () => {
    const memory: InsightMemory = {
      currentWeight:      null,
      targetWeight:       null,
      currentGoal:        null,
      lastSessionDate:    '2026-07-12T14:30:00.000Z',
      lastSessionMuscles: ['CHEST'],
      lastWeighinDate:    '2026-07-10T12:00:00.000Z',
      daysWithoutSession: 1,
      daysWithoutWeighin: 3,
    }

    const { unmount } = renderMemory('fr', memory)
    expect(screen.getByText('12/07 · Pectoraux')).toBeInTheDocument()
    expect(screen.getByText('10/07')).toBeInTheDocument()
    unmount()

    renderMemory('en', memory)
    expect(screen.getByText('07/12 · Chest')).toBeInTheDocument()
    expect(screen.getByText('07/10')).toBeInTheDocument()
  })
})
