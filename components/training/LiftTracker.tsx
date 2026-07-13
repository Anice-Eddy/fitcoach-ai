'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, Camera, Crosshair, Pause, Play, RotateCcw, Save, VideoOff } from 'lucide-react'
import type { BarPathPoint } from '@/types'
import { summarizeLiftTracking, type LiftTrackingSummary } from '@/lib/training/lift-tracking'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  value?: LiftTrackingSummary | null
  onChange: (summary: LiftTrackingSummary | null) => void
}

type TrackerStatus = 'idle' | 'camera' | 'tracking' | 'paused' | 'error'

function formatMetric(value?: number, unit = '') {
  return typeof value === 'number' ? `${value}${unit}` : '--'
}

function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
    y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
  }
}

function findTrackedPoint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  previous: { x: number; y: number },
  radius = 34,
) {
  const left = Math.max(0, Math.round(previous.x - radius))
  const top = Math.max(0, Math.round(previous.y - radius))
  const size = Math.min(radius * 2, width - left, height - top)
  if (size <= 4) return previous

  const image = ctx.getImageData(left, top, size, size)
  let bestScore = -Infinity
  let bestX = previous.x
  let bestY = previous.y

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const i = (y * size + x) * 4
      const r = image.data[i]
      const g = image.data[i + 1]
      const b = image.data[i + 2]
      const brightness = (r + g + b) / 3
      const greenBias = g - Math.max(r, b)
      const distancePenalty = Math.hypot(left + x - previous.x, top + y - previous.y) * 0.8
      const score = brightness + Math.max(0, greenBias) * 2 - distancePenalty
      if (score > bestScore) {
        bestScore = score
        bestX = left + x
        bestY = top + y
      }
    }
  }

  return { x: bestX, y: bestY }
}

export function LiftTracker({ value, onChange }: Props) {
  const { t } = useLocale()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const pointsRef = useRef<BarPathPoint[]>([])

  const [status, setStatus] = useState<TrackerStatus>('idle')
  const [summary, setSummary] = useState<LiftTrackingSummary | null>(value ?? null)
  const [travelCm, setTravelCm] = useState(60)

  const stopFrameLoop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const stopCamera = useCallback(() => {
    stopFrameLoop()
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    lastPointRef.current = null
    setStatus('idle')
  }, [stopFrameLoop])

  const drawPath = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const points = pointsRef.current
    if (points.length > 1) {
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#C8F135'
      ctx.shadowColor = 'rgba(200,241,53,0.55)'
      ctx.shadowBlur = 10
      ctx.beginPath()
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    const current = lastPointRef.current
    if (current) {
      ctx.strokeStyle = '#C8F135'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(current.x, current.y, 16, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(200,241,53,0.9)'
      ctx.beginPath()
      ctx.arc(current.x, current.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const loop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { willReadFrequently: true })
    if (!video || !canvas || !ctx || !lastPointRef.current) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const nextPoint = findTrackedPoint(ctx, canvas.width, canvas.height, lastPointRef.current)
    lastPointRef.current = nextPoint
    pointsRef.current = [...pointsRef.current, { ...nextPoint, t: performance.now() }].slice(-360)

    const nextSummary = summarizeLiftTracking(pointsRef.current, travelCm)
    if (nextSummary) {
      setSummary(nextSummary)
      onChange(nextSummary)
    }

    drawPath()
    frameRef.current = requestAnimationFrame(loop)
  }, [drawPath, onChange, travelCm])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStatus('camera')
    } catch {
      setStatus('error')
    }
  }

  const beginTracking = (point: { x: number; y: number }) => {
    pointsRef.current = [{ ...point, t: performance.now() }]
    lastPointRef.current = point
    setSummary(null)
    onChange(null)
    setStatus('tracking')
    stopFrameLoop()
    frameRef.current = requestAnimationFrame(loop)
  }

  const pauseTracking = () => {
    stopFrameLoop()
    setStatus('paused')
  }

  const resumeTracking = () => {
    if (!lastPointRef.current) return
    setStatus('tracking')
    frameRef.current = requestAnimationFrame(loop)
  }

  const resetTracking = () => {
    stopFrameLoop()
    pointsRef.current = []
    lastPointRef.current = null
    setSummary(null)
    onChange(null)
    setStatus(streamRef.current ? 'camera' : 'idle')
    drawPath()
  }

  useEffect(() => () => stopCamera(), [stopCamera])

  const activeSummary = summary ?? value ?? null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="size-4 text-[#C8F135]" />
            {t('training.liftTracking.title')}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {t('training.liftTracking.description')}
          </p>
        </div>
        <div className="rounded-full border border-[#C8F135]/25 bg-[#C8F135]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#C8F135]">
          {t('training.liftTracking.beta')}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-zinc-950 p-3">
          <p className="text-[10px] uppercase text-zinc-500">{t('training.liftTracking.peak')}</p>
          <p className="mt-1 text-lg font-bold text-white tabular-nums">{formatMetric(activeSummary?.velocityPeakMps, ' m/s')}</p>
        </div>
        <div className="rounded-xl bg-zinc-950 p-3">
          <p className="text-[10px] uppercase text-zinc-500">{t('training.liftTracking.average')}</p>
          <p className="mt-1 text-lg font-bold text-white tabular-nums">{formatMetric(activeSummary?.velocityAvgMps, ' m/s')}</p>
        </div>
        <div className="rounded-xl bg-zinc-950 p-3">
          <p className="text-[10px] uppercase text-zinc-500">{t('training.liftTracking.drift')}</p>
          <p className="mt-1 text-lg font-bold text-white tabular-nums">{formatMetric(activeSummary?.barPathDeviationCm, ' cm')}</p>
        </div>
      </div>

      <label className="mt-3 grid gap-1.5">
        <span className="text-xs text-zinc-400">{t('training.liftTracking.amplitude')}</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={travelCm}
            onChange={(event) => setTravelCm(Number(event.target.value))}
            className="w-full accent-[#C8F135]"
          />
          <span className="w-12 text-right text-xs font-semibold text-zinc-300 tabular-nums">{travelCm} cm</span>
        </div>
      </label>

      <div className="relative mt-3 aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full object-cover" />
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          onPointerDown={(event) => {
            if (status === 'camera' || status === 'paused') beginTracking(getCanvasPoint(event))
          }}
          className="absolute inset-0 size-full touch-none"
        />
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <Camera className="size-8 text-zinc-500" />
            <p className="max-w-56 text-xs text-zinc-500">{t('training.liftTracking.startCameraPrompt')}</p>
          </div>
        )}
        {status === 'camera' && (
          <div className="absolute inset-x-3 top-3 rounded-xl border border-[#C8F135]/20 bg-black/60 px-3 py-2 text-xs text-[#C8F135] backdrop-blur">
            <Crosshair className="mr-1.5 inline size-3.5" />
            {t('training.liftTracking.targetPrompt')}
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <VideoOff className="size-8 text-red-400" />
            <p className="max-w-56 text-xs text-red-200">{t('training.liftTracking.cameraUnavailable')}</p>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {status === 'idle' || status === 'error' ? (
          <button type="button" onClick={startCamera} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-3 py-2.5 text-xs font-bold text-zinc-950">
            <Camera className="size-4" /> {t('training.liftTracking.camera')}
          </button>
        ) : (
          <button type="button" onClick={stopCamera} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-300">
            <VideoOff className="size-4" /> {t('training.liftTracking.stop')}
          </button>
        )}
        {status === 'tracking' ? (
          <button type="button" onClick={pauseTracking} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-300">
            <Pause className="size-4" /> {t('training.liftTracking.pause')}
          </button>
        ) : (
          <button type="button" onClick={resumeTracking} disabled={!lastPointRef.current || status === 'idle'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-300 disabled:opacity-40">
            <Play className="size-4" /> {t('training.liftTracking.resume')}
          </button>
        )}
        <button type="button" onClick={resetTracking} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-xs font-semibold text-zinc-300">
          <RotateCcw className="size-4" /> {t('training.liftTracking.reset')}
        </button>
        <button type="button" disabled={!activeSummary} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C8F135]/35 px-3 py-2.5 text-xs font-semibold text-[#C8F135] disabled:opacity-40">
          <Save className="size-4" /> {t('training.liftTracking.autoSave')}
        </button>
      </div>
    </div>
  )
}
