# FitCoach AI

Plateforme de coaching sportif et nutritionnel personnalisée avec monétisation intégrée.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 App Router |
| Langage | TypeScript strict |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| État | Zustand |
| Auth | NextAuth.js v5 (Google + GitHub) |
| ORM | Prisma |
| Base de données | PostgreSQL via Neon |
| Paiement | Stripe |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| PDF | jsPDF |
| i18n | next-intl (FR / EN) |
| PWA | next-pwa |
| Notifications | Sonner |
| Déploiement | Vercel |

## Prérequis

- Node.js 20+
- npm 10+
- Compte [Neon](https://neon.tech) (PostgreSQL gratuit)
- Compte [Stripe](https://stripe.com) (test mode)
- Projet Firebase Auth pour les connexions sociales

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/TON_USERNAME/fitcoach-ai.git
cd fitcoach-ai

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 4. Générer le client Prisma et migrer la base
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed des données de démonstration
npx prisma db seed

# 6. Lancer en développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # ESLint
npm run type-check   # TypeScript strict (tsc --noEmit)
npm run db:studio    # Prisma Studio (interface BDD)
npm run db:seed      # Seed des données de démo
npm run db:reset     # Reset + re-seed (dev uniquement)
```

## Architecture des routes

```
/                          → Landing page + pricing
/onboarding                → Stepper multi-étapes (sans layout app)
/auth/signin               → Connexion email + Firebase social
/dashboard                 → Tableau de bord principal
/training                  → Programme + séance du jour
/training/[sessionId]      → Détail séance avec chronomètre
/nutrition                 → Plan alimentaire hebdomadaire
/nutrition/shopping-list   → Liste de courses générée
/progress                  → Graphiques et historique
/exports                   → Export PDF / JSON + import
/settings                  → Profil, unités, abonnement
/shop                      → Produits affiliés par catégorie
/pricing                   → Plans tarifaires
/coach/*                   → Dashboard coach (mocké MVP)
```

## Plans tarifaires

| Plan | Prix | Fonctionnalités |
|---|---|---|
| Free | 0$ | Onboarding, 1 programme, nutrition 3j, stockage local |
| Pro | 9,99$/mois ou 79$/an | Illimité, cloud, export PDF, toutes intégrations |
| Elite | 19,99$/mois ou 159$/an | Pro + ajustements IA, accès anticipé |
| Business | 199$/mois | Coaches (mocké MVP) |

## Structure des dossiers

```
fitcoach-ai/
├── app/               # Next.js App Router
│   ├── (marketing)/   # Landing + pricing (sans sidebar)
│   ├── (auth)/        # Auth signin
│   ├── (app)/         # Routes protégées (avec sidebar)
│   ├── coach/         # Dashboard coach (mocké)
│   ├── onboarding/    # Stepper onboarding
│   └── api/           # Routes API
├── components/        # Composants React
│   ├── layout/        # Sidebar, BottomNav, Header
│   ├── ui/            # Composants UI génériques
│   ├── onboarding/    # Steps du stepper
│   ├── dashboard/     # Widgets dashboard
│   ├── training/      # Composants entraînement
│   ├── nutrition/     # Composants nutrition
│   ├── pricing/       # Composants pricing
│   ├── affiliates/    # Composants shop affilié
│   ├── integrations/  # Composants intégrations
│   └── exports/       # Composants export/import
├── lib/               # Logique métier
│   ├── auth/          # NextAuth config
│   ├── prisma/        # Client Prisma singleton
│   ├── storage/       # Adapter local/cloud
│   ├── stripe/        # Client + plans + webhooks
│   ├── training/      # Génération programme
│   ├── nutrition/     # Génération plan alimentaire
│   ├── exports/       # PDF + JSON
│   └── integrations/  # Connecteurs externes (mockés)
├── stores/            # Zustand stores
├── types/             # Types TypeScript centralisés
├── utils/             # Calculs fitness + conversions
├── hooks/             # Hooks React custom
├── prisma/            # Schema + seed
├── public/            # Assets statiques + SVG
└── messages/          # Traductions FR / EN
```

## Déploiement Vercel

1. Pousser le code sur GitHub
2. [vercel.com](https://vercel.com) → **Add New Project** → importer le repo
3. Ajouter toutes les variables du `.env.example` dans les settings Vercel
4. Cliquer **Deploy** — Vercel détecte Next.js automatiquement

**Coût total MVP : 0$/mois**
- Vercel Hobby : gratuit
- Neon PostgreSQL : gratuit jusqu'à 0.5 GB
- Stripe : gratuit jusqu'aux premières ventes

## Conventions de commits

```
feat:     nouvelle fonctionnalité
fix:      correction de bug
chore:    maintenance, dépendances
refactor: refactorisation sans changement fonctionnel
docs:     documentation uniquement
test:     ajout ou modification de tests
```

## Modules MVP

| Module | Statut |
|---|---|
| Onboarding stepper | Complet |
| Dashboard | Complet |
| Training | Complet |
| Nutrition | Complet |
| Exports PDF/JSON | Complet |
| Auth Google/GitHub | Complet |
| Stripe Pro | Complet |
| Stockage local/cloud | Complet |
| Intégrations (Garmin/Fitbit/Strava) | Mocké |
| Dashboard coach B2B | Mocké |
| Affiliation avancée | Mocké |
| Dashboard admin | Mocké |

## Licence

MIT
