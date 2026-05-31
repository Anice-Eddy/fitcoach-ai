import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { BackButton } from '@/components/ui/BackButton'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — BodyOps",
  description: "Conditions générales d'utilisation de l'application BodyOps.",
}

const LAST_UPDATED = '31 mai 2026'

export default function TermsPage() {
  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />

      <header className="relative z-10 flex items-center gap-4 px-6 py-5 border-b border-zinc-800/60">
        <Logo href="/" size="md" />
        <BackButton className="ml-auto inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors" />
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Conditions Générales d'Utilisation</h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <Section title="1. Présentation du service">
          <p>
            BodyOps est une application de coaching sportif assistée par intelligence artificielle. Elle propose des
            programmes d'entraînement, des plans nutritionnels et un suivi de progression personnalisés, accessibles
            depuis un navigateur web ou une application mobile installable (PWA).
          </p>
          <p className="mt-3">
            L'utilisation de BodyOps est réservée aux personnes âgées d'au moins <strong>13 ans</strong>. En créant
            un compte, vous confirmez remplir cette condition.
          </p>
        </Section>

        <Section title="2. Avertissement — L'IA n'est pas un coach professionnel">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 space-y-2">
            <p className="font-semibold text-amber-300">Important — à lire attentivement</p>
            <p className="text-sm text-amber-200/80">
              L'assistant IA de BodyOps est un outil d'aide à la planification sportive et nutritionnelle. Il
              <strong> ne remplace en aucun cas</strong> un coach sportif certifié, un nutritionniste ou un
              professionnel de santé.
            </p>
            <ul className="text-sm text-amber-200/80 list-disc list-inside space-y-1">
              <li>Consultez un médecin avant de démarrer un programme intensif si vous avez des antécédents médicaux.</li>
              <li>Les recommandations générées sont indicatives et basées sur les données que vous fournissez.</li>
              <li>BodyOps décline toute responsabilité en cas de blessure liée à une mauvaise exécution ou à un suivi inadapté.</li>
            </ul>
          </div>
        </Section>

        <Section title="3. Création de compte et responsabilité">
          <p>
            Vous êtes responsable de l'exactitude des informations renseignées lors de l'inscription (âge, poids,
            taille, conditions de santé, etc.). Des données incorrectes peuvent conduire à des recommandations
            inadaptées.
          </p>
          <p className="mt-3">
            Chaque compte est strictement personnel. Vous vous engagez à ne pas partager vos identifiants et à
            informer BodyOps de toute utilisation non autorisée.
          </p>
        </Section>

        <Section title="4. Propriété intellectuelle">
          <p>
            L'ensemble du contenu de l'application (code, design, textes, plans générés) est la propriété exclusive
            de BodyOps ou de ses fournisseurs. Toute reproduction, distribution ou modification sans autorisation
            écrite est interdite.
          </p>
        </Section>

        <Section title="5. Limitation de responsabilité">
          <p>
            BodyOps ne peut être tenu responsable des dommages directs ou indirects liés à l'utilisation de
            l'application, y compris les blessures physiques, les erreurs de calcul nutritionnel ou les
            interruptions de service.
          </p>
        </Section>

        <Section title="6. Modifications des CGU">
          <p>
            BodyOps se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés
            par e-mail ou notification in-app. La poursuite de l'utilisation après notification vaut acceptation.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Pour toute question relative à ces CGU, utilisez la page de contact accessible depuis les Paramètres de l'application.
          </p>
        </Section>

        <div className="pt-6 border-t border-zinc-800 flex flex-wrap gap-4 text-sm text-zinc-500">
          <Link href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité →</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
    </section>
  )
}
