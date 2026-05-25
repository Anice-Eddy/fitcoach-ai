// Skeleton de chargement générique et variantes spécialisées

import { cn } from '@/lib/utils'

interface SkeletonProps { className?: string }

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-zinc-800', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex gap-4">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}
