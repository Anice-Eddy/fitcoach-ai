/** Sends a fire-and-forget POST to record an affiliate click for the given productId; never throws. */
export function trackAffiliateClick(productId: string): void {
  fetch('/api/affiliates/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ productId }),
  }).catch(() => {})
}
