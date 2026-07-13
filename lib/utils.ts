// cn utility: merges Tailwind classes with clsx and tailwind-merge.
// Used by all shadcn/ui components.

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges Tailwind class names using clsx and tailwind-merge to avoid class conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
