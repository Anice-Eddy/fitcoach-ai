'use client'
// Actions rapides du dashboard

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Scale, Utensils, Play, Plus } from 'lucide-react'

const ACTIONS = [
  { label: 'Peser',         icon: Scale,    href: '/progress',   color: '#60a5fa' },
  { label: 'Ajouter repas', icon: Utensils, href: '/nutrition',  color: '#4ade80' },
  { label: 'Démarrer séance', icon: Play,   href: '/training',   color: '#C8F135' },
  { label: 'Ajouter',       icon: Plus,     href: '/progress',   color: '#f472b6' },
]

export function QuickActions() {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Actions rapides</h3>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map(({ label, icon: Icon, href, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={href} className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="size-5" style={{ color }} />
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-white transition-colors text-center leading-tight">{label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
