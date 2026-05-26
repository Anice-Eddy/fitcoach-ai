import { Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?:      string
  size?:      'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { badge: 'size-7',  icon: 'size-3.5', text: 'text-base',  gap: 'gap-2' },
  md: { badge: 'size-9',  icon: 'size-4.5', text: 'text-lg',   gap: 'gap-2.5' },
  lg: { badge: 'size-12', icon: 'size-6',   text: 'text-2xl',  gap: 'gap-3' },
  xl: { badge: 'size-16', icon: 'size-8',   text: 'text-4xl',  gap: 'gap-4' },
}

export function Logo({ href, size = 'md', className }: LogoProps) {
  const s = sizes[size]

  const content = (
    <span className={cn('flex items-center', s.gap, className)}>
      <span className={cn(s.badge, 'rounded-xl bg-[#C8F135] flex items-center justify-center shrink-0 shadow-lg shadow-[#C8F135]/20')}>
        <Zap className={cn(s.icon, 'text-zinc-900 fill-zinc-900')} />
      </span>
      <span className={cn(s.text, 'font-black tracking-tight text-white leading-none')}>
        Body<span className="text-[#C8F135]">Ops</span>
      </span>
    </span>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
