import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    // Dev: affiche le lien dans la console
    console.log(`\n[DEV] Lien de réinitialisation pour ${to}:\n${resetUrl}\n`)
    return
  }

  await resend.emails.send({
    from:    'BodyOps <noreply@bodyops.app>',
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
}
