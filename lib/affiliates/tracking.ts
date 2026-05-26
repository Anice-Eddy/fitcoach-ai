// Suivi des clics affiliés — fire-and-forget, ne bloque jamais la navigation

export function trackAffiliateClick(productId: string): void {
  fetch('/api/affiliates/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ productId }),
  }).catch(() => {})
}
