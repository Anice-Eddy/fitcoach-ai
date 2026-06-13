import type { ReactNode } from 'react'

interface CoachPageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

// Shared coach page header so every coach screen starts with the same rhythm.
export function CoachPageHeader({ title, description, actions }: CoachPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
