// Suivi des clics affiliés — appel API + fallback silencieux

export async function trackAffiliateClick(productId: string, url: string): Promise<void> {
  try {
    await fetch('/api/affiliates/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ productId }),
    })
  } catch {
    // Echec silencieux — ne pas bloquer la navigation
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
