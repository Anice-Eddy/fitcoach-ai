import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'BodyOps <noreply@bodyops.app>'

export function isEmailDeliveryConfigured() {
  return Boolean(resend)
}

/** Sends a password reset email via Resend; logs the link to the console in development when Resend is not configured. */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_NOT_CONFIGURED')
    }
    // En développement local, on affiche le lien pour tester le flux sans envoyer un vrai email.
    console.log(`\n[DEV] Lien de réinitialisation pour ${to}:\n${resetUrl}\n`)
    return
  }

  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to,
    subject: 'Réinitialisation de ton mot de passe — BodyOps',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09090b;color:#fff;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:900;color:#fff">Body<span style="color:#C8F135">Ops</span></span>
        </div>
        <h1 style="font-size:20px;font-weight:700;margin-bottom:8px">Réinitialisation de mot de passe</h1>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:24px">
          Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous.
          Ce lien expire dans <strong style="color:#fff">1 heure</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#C8F135;color:#09090b;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#52525b;font-size:12px">
          Si tu n'as pas fait cette demande, ignore cet email. Ton mot de passe ne sera pas modifié.
        </p>
        <hr style="border:none;border-top:1px solid #27272a;margin:24px 0" />
        <p style="color:#3f3f46;font-size:11px">BodyOps · Ce lien expire dans 1 heure.</p>
      </div>
    `,
  })

  if (error) {
    console.error('[email] password reset send failed:', error)
    throw new Error('EMAIL_SEND_FAILED')
  }
}

/** Sends an appointment confirmation email with date, time, and optional meet link; logs details to console in development. */
export async function sendAppointmentEmail(
  to: string,
  coachName: string,
  title: string,
  scheduledAt: Date,
  meetLink?: string | null,
) {
  const dateStr = scheduledAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_NOT_CONFIGURED')
    }
    console.log(`\n[DEV] Rendez-vous pour ${to}: ${title} le ${dateStr} à ${timeStr}\n`)
    return
  }

  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to,
    subject: `Rendez-vous confirmé avec ${coachName} — BodyOps`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09090b;color:#fff;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-size:24px;font-weight:900;color:#fff">Body<span style="color:#C8F135">Ops</span></span>
        </div>
        <h1 style="font-size:20px;font-weight:700;margin-bottom:8px">Rendez-vous confirmé</h1>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:24px">
          Ton rendez-vous avec <strong style="color:#fff">${coachName}</strong> a été planifié.
        </p>
        <div style="background:#18181b;border-radius:12px;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:14px"><strong style="color:#a1a1aa">Séance :</strong> ${title}</p>
          <p style="margin:0 0 8px;font-size:14px"><strong style="color:#a1a1aa">Date :</strong> ${dateStr}</p>
          <p style="margin:0 0 ${meetLink ? '8px' : '0'};font-size:14px"><strong style="color:#a1a1aa">Heure :</strong> ${timeStr}</p>
          ${meetLink ? `<p style="margin:0;font-size:14px"><strong style="color:#a1a1aa">Lien :</strong> <a href="${meetLink}" style="color:#C8F135">${meetLink}</a></p>` : ''}
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bodyops.app'}/coaching/status"
           style="display:inline-block;background:#C8F135;color:#09090b;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
          Voir mon rendez-vous
        </a>
        <hr style="border:none;border-top:1px solid #27272a;margin:24px 0" />
        <p style="color:#3f3f46;font-size:11px">BodyOps · Tu reçois cet email car tu as un rendez-vous planifié.</p>
      </div>
    `,
  })

  if (error) {
    console.error('[email] appointment send failed:', error)
    throw new Error('EMAIL_SEND_FAILED')
  }
}
