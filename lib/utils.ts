// Utilitaire cn — fusion de classes Tailwind avec clsx + tailwind-merge
// Utilisé par tous les composants shadcn/ui

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
