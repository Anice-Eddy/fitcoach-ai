import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { BackButton } from '@/components/ui/BackButton'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — BodyOps',
  description: 'Comment BodyOps collecte, utilise et protège vos données personnelles.',
}

const LAST_UPDATED = '31 mai 2026'
const COMPANY_EMAIL = 'privacy@bodyops.app'
const DPO_EMAIL = 'dpo@bodyops.app'

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />

      <header className="relative z-10 flex items-center gap-4 px-6 py-5 border-b border-zinc-800/60">
        <Logo href="/" size="md" />
        <BackButton className="ml-auto inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors" />
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Politique de confidentialité</h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <Section title="1. Qui sommes-nous ?">
          <p>
            BodyOps est une application de coaching sportif en ligne. Dans le cadre du Règlement Général sur la
            Protection des Données (RGPD — UE 2016/679), BodyOps agit en qualité de <strong>responsable du
            traitement</strong> pour les données personnelles de ses utilisateurs.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <table className="mt-4 w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400 text-left">
                <th className="pb-2 pr-4 font-semibold">Catégorie</th>
                <th className="pb-2 pr-4 font-semibold">Données</th>
                <th className="pb-2 font-semibold">Finalité</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                ['Identité', 'Prénom, âge, genre', 'Personnalisation du programme'],
                ['Corps', 'Poids, taille, mensurations', 'Calcul IMC, macros, progression'],
                ['Objectifs', 'Objectif fitness, niveau, focus corporel', 'Génération de programmes IA'],
                ['Santé', 'Blessures, zones à ménager (optionnel)', 'Sécurité des exercices proposés'],
                ['Alimentation', 'Préférences, allergies, régime (optionnel)', 'Plans nutritionnels adaptés'],
                ['Usage IA', 'Nombre de requêtes par jour', 'Gestion des quotas d\'utilisation'],
                ['Connexion', 'Adresse e-mail, mot de passe haché', 'Authentification sécurisée'],
              ].map(([cat, data, purpose]) => (
                <tr key={cat} className="border-b border-zinc-800/50">
                  <td className="py-2 pr-4 font-medium text-white">{cat}</td>
                  <td className="py-2 pr-4">{data}</td>
                  <td className="py-2">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="3. Base légale du traitement">
          <p>Nos traitements reposent sur :</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li><strong>Votre consentement</strong> — collecté lors de l'inscription et gérable depuis les paramètres.</li>
            <li><strong>L'exécution du contrat</strong> — données nécessaires pour vous fournir le service.</li>
            <li><strong>Intérêt légitime</strong> — amélioration de l'algorithme IA sur la base de données agrégées anonymisées.</li>
          </ul>
        </Section>

        <Section title="4. Conservation des données">
          <p>
            Vos données sont conservées pendant la durée de vie de votre compte, puis supprimées dans un délai de
            <strong> 30 jours</strong> après clôture. Les données de log techniques sont supprimées après
            <strong> 12 mois</strong>.
          </p>
        </Section>

        <Section title="5. Partage des données">
          <p>
            BodyOps ne vend ni ne loue vos données à des tiers. Certains sous-traitants interviennent pour des
            services techniques :
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li><strong>Hébergement</strong> — Vercel (États-Unis, certifié EU-US Data Privacy Framework)</li>
            <li><strong>Base de données</strong> — Neon / Supabase (UE)</li>
            <li><strong>IA</strong> — Anthropic Claude API (États-Unis, logs conservés 30 jours à des fins de sécurité, non utilisés pour entraîner les modèles — <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">politique Anthropic</a>)</li>
          </ul>
        </Section>

        <Section title="6. Vos droits (RGPD)">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li><strong>Accès</strong> — obtenir une copie de vos données</li>
            <li><strong>Rectification</strong> — corriger des informations inexactes</li>
            <li><strong>Effacement</strong> — demander la suppression de votre compte et de vos données</li>
            <li><strong>Portabilité</strong> — recevoir vos données dans un format lisible par machine</li>
            <li><strong>Opposition</strong> — vous opposer à certains traitements</li>
            <li><strong>Retrait du consentement</strong> — à tout moment, sans effet rétroactif</li>
          </ul>
          <p className="mt-3">
            Pour exercer vos droits, contactez notre DPO à{' '}
            <a href={`mailto:${DPO_EMAIL}`} className="text-[#C8F135] hover:underline">{DPO_EMAIL}</a>.
            Vous pouvez également introduire une réclamation auprès de la{' '}
            <strong>CNIL</strong> (France) ou de l'autorité compétente de votre pays de résidence.
          </p>
        </Section>

        <Section title="7. Sécurité">
          <p>
            Nous appliquons des mesures de sécurité techniques et organisationnelles : chiffrement HTTPS,
            mots de passe hachés (bcrypt), accès base de données restreints, journalisation des accès.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            BodyOps utilise uniquement des cookies strictement nécessaires à l'authentification (session NextAuth).
            Aucun cookie publicitaire ou de traçage tiers n'est déposé.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Pour toute question relative à la protection de vos données :{' '}
            <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#C8F135] hover:underline">{COMPANY_EMAIL}</a>
          </p>
        </Section>

        <div className="pt-6 border-t border-zinc-800 flex flex-wrap gap-4 text-sm text-zinc-500">
          <Link href="/terms" className="hover:text-white transition-colors">Conditions d'utilisation →</Link>
          <Link href="/" className="hover:text-white transition-colors">Retour à l'accueil</Link>
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
