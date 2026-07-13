import type { BarPathPoint } from '@/types'

export interface LiftTrackingSummary {
  velocityPeakMps: number
  velocityAvgMps: number
  barPathDeviationCm: number
  barPathPoints: BarPathPoint[]
}

function distance(a: BarPathPoint, b: BarPathPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function roundMetric(value: number, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function downsampleBarPath(points: BarPathPoint[], maxPoints = 80) {
  if (points.length <= maxPoints) return points
  const step = (points.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => points[Math.round(index * step)])
}

export function summarizeLiftTracking(points: BarPathPoint[], travelCm = 60): LiftTrackingSummary | null {
  if (points.length < 3) return null

  const yValues = points.map(point => point.y)
  const pixelTravel = Math.max(...yValues) - Math.min(...yValues)
  if (pixelTravel <= 0) return null

  const metersPerPixel = (travelCm / 100) / pixelTravel
  const velocities: number[] = []

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1]
    const current = points[index]
    const seconds = (current.t - previous.t) / 1000
    if (seconds <= 0) continue
    const segmentPixels = distance(previous, current)
    velocities.push((segmentPixels * metersPerPixel) / seconds)
  }

  if (velocities.length === 0) return null

  const avgX = points.reduce((total, point) => total + point.x, 0) / points.length
  const lateralDeviationPx = points.reduce((max, point) => Math.max(max, Math.abs(point.x - avgX)), 0)

  return {
    velocityPeakMps:      roundMetric(Math.max(...velocities), 2),
    velocityAvgMps:       roundMetric(velocities.reduce((total, value) => total + value, 0) / velocities.length, 2),
    barPathDeviationCm:   roundMetric(lateralDeviationPx * metersPerPixel * 100, 1),
    barPathPoints:        downsampleBarPath(points).map(point => ({
      x: roundMetric(point.x, 1),
      y: roundMetric(point.y, 1),
      t: Math.round(point.t),
    })),
  }
}
