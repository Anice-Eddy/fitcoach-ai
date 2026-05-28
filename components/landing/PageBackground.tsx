'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  r: number; a: number; da: number
}

function FullPageCanvas({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    let w = 0, h = 0
    let particles: Particle[] = []
    let raf = 0

    const count = () => {
      const vw = window.innerWidth
      if (vw < 640) return 28
      if (vw < 1024) return 48
      return 72
    }

    const init = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = Array.from({ length: count() }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * 0.5 + 0.07,
        da: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
      }))
    }
    init()

    const tick = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, w, h)
        for (const p of particles) {
          p.x = (p.x + p.vx + w) % w
          p.y = (p.y + p.vy + h) % h
          p.a += p.da
          if (p.a > 0.55 || p.a < 0.06) p.da *= -1
          p.a = Math.min(0.55, Math.max(0.06, p.a))

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200,241,53,${p.a})`
          ctx.fill()

          if (p.r > 1.2) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(200,241,53,${p.a * 0.12})`
            ctx.fill()
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init) }
  }, [reduced])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />
}

function HeroArtwork({ reduced }: { reduced: boolean }) {
  const revealStyle = reduced
    ? {}
    : {
        animation: 'bg-artwork-draw 10s linear infinite',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(var(--scan-y) - 0.5%), rgba(0,0,0,0.34) var(--scan-y), transparent calc(var(--scan-y) + 3.5%), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black calc(var(--scan-y) - 0.5%), rgba(0,0,0,0.34) var(--scan-y), transparent calc(var(--scan-y) + 3.5%), transparent 100%)',
      }

  return (
    <div className="bg-artwork-reveal absolute inset-0" style={revealStyle}>
      {/* Image fournie par l'utilisateur, traitée comme artwork de fond. */}
      <ArtworkImage opacity={reduced ? 0.5 : 0.82} />
      <ArtworkGlow />
      <ArtworkOverlay />
    </div>
  )
}

function ArtworkImage({ opacity, filter = 'saturate(1.2) contrast(1.08)' }: { opacity: number; filter?: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: 'url("/images/bodyops-strongman-hero.png")',
        backgroundPosition: 'center 18%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        opacity,
        filter,
      }}
    />
  )
}

function ArtworkGlow({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse at 50% 34%, rgba(200,241,53,${opacity}) 0%, rgba(200,241,53,0.08) 38%, transparent 72%)`,
        mixBlendMode: 'screen',
      }}
    />
  )
}

function ArtworkOverlay() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: [
          'linear-gradient(90deg, rgba(9,9,11,0.90) 0%, rgba(9,9,11,0.54) 34%, rgba(9,9,11,0.52) 62%, rgba(9,9,11,0.86) 100%)',
          'linear-gradient(180deg, rgba(9,9,11,0.14) 0%, rgba(9,9,11,0.40) 58%, rgba(9,9,11,0.92) 100%)',
        ].join(', '),
      }}
    />
  )
}

/**
 * Fixed full-viewport landing background.
 * Uses the provided strongman artwork plus lightweight grid, particles, and scan effects.
 */
export function PageBackground({ showArtwork = true }: { showArtwork?: boolean } = {}) {
  const reduced = useReducedMotion() ?? false

  return (
    <>
      <style suppressHydrationWarning>{`
        @property --scan-y {
          syntax: '<percentage>';
          inherits: false;
          initial-value: 0%;
        }
        @keyframes bg-grid-drift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes bg-scan {
          0%   { transform: translate3d(0, 0,      0); opacity: 0; }
          3%   { opacity: 1; }
          78%  { transform: translate3d(0, 108vh,  0); opacity: 1; }
          88%  { opacity: 0; }
          100% { transform: translate3d(0, 108vh,  0); opacity: 0; }
        }
        @keyframes bg-artwork-draw {
          0% { --scan-y: 0%; opacity: 0; transform: scale(1.018); }
          3% { opacity: 0.16; }
          10% { opacity: 0.70; }
          78% { --scan-y: 108%; opacity: 0.86; transform: scale(1); }
          90% { --scan-y: 108%; opacity: 0.18; transform: scale(1.01); }
          100% { --scan-y: 108%; opacity: 0; transform: scale(1.018); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-grid-anim { animation: none !important; }
          .bg-scan-line { display: none !important; }
          .bg-artwork-reveal { animation: none !important; opacity: 0.52 !important; transform: none !important; filter: none !important; mask-image: none !important; -webkit-mask-image: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
        {showArtwork && <HeroArtwork reduced={reduced} />}

        <div
          className="bg-grid-anim absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(200,241,53,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200,241,53,0.045) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: reduced ? 'none' : 'bg-grid-drift 9s linear infinite',
            maskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 0%, black 0%, transparent 85%)',
          }}
        />

        <div
          className="absolute"
          style={{
            top: '-5%', left: '50%',
            transform: 'translateX(-50%)',
            width: '840px', height: '420px',
            background: 'radial-gradient(ellipse, rgba(200,241,53,0.12) 0%, transparent 68%)',
            filter: 'blur(42px)',
          }}
        />

        <FullPageCanvas reduced={reduced} />

        <div
          className="bg-scan-line absolute left-0 right-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,241,53,0.3) 25%, rgba(200,241,53,0.7) 50%, rgba(200,241,53,0.3) 75%, transparent 100%)',
            boxShadow: '0 0 8px 1px rgba(200,241,53,0.2), 0 0 18px 2px rgba(200,241,53,0.07)',
            animation: reduced ? 'none' : 'bg-scan 10s linear infinite',
            willChange: 'transform, opacity',
          }}
        />
      </div>
    </>
  )
}
