// Setup global de Vitest — matchers Jest DOM
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation pour les composants qui utilisent useRouter/usePathname
vi.mock('next/navigation', () => ({
  useRouter:   () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image (rendu simplifié en test)
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => {
    const React = require('react')
    return React.createElement('img', { src, alt })
  },
}))

// Mock sonner (toasts)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error:   vi.fn(),
    info:    vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}))
