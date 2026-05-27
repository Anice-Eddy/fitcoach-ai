'use client'
// Badge de plan affiché dans la sidebar et les settings

import Link from 'next/link'
import { Sparkles, Zap, Building2 } from 'lucide-react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { cn } from '@/lib/utils'

const PLAN_CONFIG = {
  FREE:     { label: 'Free',     icon: null,     color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
  PRO:      { label: 'Pro',      icon: Sparkles, color: 'text-[#C8F135] bg-[#C8F135]/10 border-[#C8F135]/20' },
  ELITE:    { label: 'Elite',    icon: Zap,      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  BUSINESS: { label: 'Entreprise', icon: Building2, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
}

interface PlanBadgeProps { className?: string }

/** Displays the user's current subscription plan badge with plan-specific icon and color, plus an upgrade link for non-Pro plans. */
export function PlanBadge({ className }: PlanBadgeProps) {
  const { plan } = useSubscriptionStore()
  const config   = PLAN_CONFIG[plan]
  const Icon     = config.icon

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border', config.color)}>
        {Icon && <Icon className="size-3" />}
        Plan {config.label}
      </div>
      {plan === 'FREE' && (
        <Link
          href="/pricing"
          className="block w-full text-center py-1.5 px-3 rounded-lg bg-[#C8F135] text-zinc-900 text-xs font-bold hover:bg-[#d4f54d] transition-colors"
        >
          Passer à Pro ✦
        </Link>
      )}
    </div>
  )
}
