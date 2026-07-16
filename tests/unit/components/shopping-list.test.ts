import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { ShoppingList } from '@/components/nutrition/ShoppingList'
import type { GroupedShoppingList } from '@/lib/nutrition/shopping-list'

const grouped: GroupedShoppingList = {
  protein: [
    { name: 'Blanc de poulet', totalGrams: 300, category: 'protein' },
  ],
  carb:      [],
  fat:       [],
  vegetable: [],
  fruit:     [],
  dairy:     [],
  other:     [],
}

function renderShoppingList(locale: 'fr' | 'en') {
  localStorage.setItem('bodyops:locale', locale)
  return render(
    React.createElement(
      LocaleProvider,
      {
        initialLocale: locale,
      },
      React.createElement(ShoppingList, { grouped }),
    ),
  )
}

describe('ShoppingList', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows canonical food names in French', () => {
    renderShoppingList('fr')

    expect(screen.getByText('Blanc de poulet')).toBeInTheDocument()
    expect(screen.queryByText('Chicken breast')).not.toBeInTheDocument()
  })

  it('shows canonical food names in English', () => {
    renderShoppingList('en')

    expect(screen.getByText('Chicken breast')).toBeInTheDocument()
    expect(screen.queryByText('Blanc de poulet')).not.toBeInTheDocument()
  })
})
