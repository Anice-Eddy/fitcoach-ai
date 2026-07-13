import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { CategoryFilter } from '@/components/affiliates/CategoryFilter'

function renderFilter(locale: 'fr' | 'en') {
  localStorage.setItem('bodyops:locale', locale)
  return render(
    React.createElement(
      LocaleProvider,
      {
        initialLocale: locale,
        children: React.createElement(CategoryFilter, {
          selected: 'ALL',
          onChange: vi.fn(),
          counts:   { SUPPLEMENTS: 2 },
        }),
      },
    ),
  )
}

describe('CategoryFilter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders category labels in French', () => {
    renderFilter('fr')

    expect(screen.getByRole('button', { name: /Tout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Suppléments/i })).toBeInTheDocument()
  })

  it('renders category labels in English', () => {
    renderFilter('en')

    expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Supplements/i })).toBeInTheDocument()
  })
})
