'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Zap, ArrowRight, Check } from 'lucide-react'

/**
 * Hero section — content only (badge, title, subtitle, CTA, trust line).
 * Background effects live in PageBackground (fixed, full-viewport).
 * The hero-specific green halo is rendered here as an absolute layer.
 */
export function HeroSection() {
  const reduced = useReducedMotion() ?? false

  return (
    <section className="relative w-full overflow-hidden">

      {/* Hero-specific neon halo — tighter, centred behind the title */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: '36%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(200,241,53,0.11) 0%, rgba(200,241,53,0.03) 50%, transparent 72%)',
          filter: 'blur(28px)',
          animation: reduced ? 'none' : 'hero-halo-pulse 4.5s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes hero-halo-pulse {
          0%, 100% { opacity: 1;   transform: translate(-50%,-50%) scale(1);    }
          50%       { opacity: 0.6; transform: translate(-50%,-50%) scale(1.07); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-halo { animation: none !important; }
        }
      `}</style>

      {/* Bottom blend — softens the transition into the features section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        aria-hidden
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(9,9,11,0.5))' }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-24">

        {/* AI badge with dual pulse rings */}
        <motion.div
          className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 text-[#C8F135] text-sm font-medium mb-8"
          initial={reduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {!reduced && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border border-[#C8F135]/50"
                animate={{ scale: [1, 1.13, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-[#C8F135]/25"
                animate={{ scale: [1, 1.28, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                aria-hidden
              />
            </>
          )}
          <motion.span
            className="relative size-1.5 rounded-full bg-[#C8F135] inline-block flex-shrink-0"
            animate={reduced ? {} : { opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <Zap className="size-3.5" />
          Propulsé par l&apos;intelligence artificielle
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-6xl font-bold leading-tight mb-6"
          initial={reduced ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
        >
          Votre coach fitness<br />
          <span
            className="text-[#C8F135]"
            style={{
              textShadow: reduced
                ? 'none'
                : '0 0 36px rgba(200,241,53,0.38), 0 0 72px rgba(200,241,53,0.14)',
            }}
          >
            personnalisé
          </span>
          , 24h/24
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          Programmes d&apos;entraînement, nutrition adaptée et suivi de progression — tout en un.{' '}
          Commencez gratuitement, sans carte de crédit.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.29, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/auth/register/member"
            className="group relative flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C8F135] text-zinc-900 font-bold text-lg hover:bg-[#d4f54d] transition-colors overflow-hidden"
          >
            {!reduced && (
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                aria-hidden
              />
            )}
            Commencer gratuitement <ArrowRight className="size-5" />
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.p
          className="text-sm text-zinc-500 mt-4"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.44 }}
        >
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Aucune CB requise
          <span className="mx-3">·</span>
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Gratuit pour commencer
          <span className="mx-3">·</span>
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Coaching IA ou humain
        </motion.p>
      </div>
    </section>
  )
}
