'use client'

import { useEffect, useState } from 'react'

/** Renders the current calendar year, hydrated client-side to avoid SSR mismatch. */
export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return <>{year}</>
}
