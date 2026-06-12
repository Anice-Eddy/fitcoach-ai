import { prisma } from '@/lib/prisma/client'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/** In-memory sliding-window rate limit — kept for internal/non-AI use cases. */
export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now     = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (current.count >= limit) return { ok: false, remaining: 0, resetAt: current.resetAt }
  current.count += 1
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt }
}

function dailyLimitForPlan(plan?: string | null) {
  return plan && plan !== 'FREE' ? 500 : 100
}

/**
 * DB-backed daily quota for AI calls.
 * Free: 100/day, Premium/paid plans: 500/day. Resets at midnight UTC.
 */
export async function checkDailyRateLimit(
  userId:  string,
  plan?: string | null,
): Promise<{ ok: boolean; used: number; limit: number; remaining: number; resetAt: number; warning: boolean }> {
  const limit = dailyLimitForPlan(plan)
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

  const tomorrow = new Date()
  tomorrow.setUTCHours(24, 0, 0, 0)

  const usage = await prisma.aIUsageDaily.upsert({
    where:  { userId_date: { userId, date: today } },
    create: { userId, date: today, count: 1 },
    update: { count: { increment: 1 } },
  })

  if (usage.count > limit) {
    // Roll back the increment — this request is rejected
    await prisma.aIUsageDaily.update({
      where: { userId_date: { userId, date: today } },
      data:  { count: { decrement: 1 } },
    })
    return { ok: false, used: limit, limit, remaining: 0, resetAt: tomorrow.getTime(), warning: true }
  }

  return {
    ok: true,
    used: usage.count,
    limit,
    remaining: limit - usage.count,
    resetAt: tomorrow.getTime(),
    warning: usage.count >= Math.ceil(limit * 0.8),
  }
}
