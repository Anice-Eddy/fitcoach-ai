import { describe, expect, it } from 'vitest'
import { downsampleBarPath, summarizeLiftTracking } from '@/lib/training/lift-tracking'

describe('lift tracking metrics', () => {
  it('calculates velocities and deviation from a bar path', () => {
    const summary = summarizeLiftTracking([
      { x: 100, y: 200, t: 0 },
      { x: 101, y: 160, t: 400 },
      { x: 102, y: 120, t: 800 },
      { x: 100, y: 80,  t: 1200 },
    ], 60)

    expect(summary).not.toBeNull()
    expect(summary?.velocityPeakMps).toBeGreaterThan(0)
    expect(summary?.velocityAvgMps).toBeGreaterThan(0)
    expect(summary?.barPathDeviationCm).toBeGreaterThanOrEqual(0)
    expect(summary?.barPathPoints.length).toBe(4)
  })

  it('downsamples points to avoid storing an overly heavy trace', () => {
    const points = Array.from({ length: 200 }, (_, index) => ({ x: index, y: index, t: index * 16 }))
    const sampled = downsampleBarPath(points, 40)

    expect(sampled).toHaveLength(40)
    expect(sampled[0]).toEqual(points[0])
    expect(sampled.at(-1)).toEqual(points.at(-1))
  })
})
