# BODYOPS V3 — MASTER PRODUCT & TECHNICAL SPECIFICATION

IMPORTANT

Avant d'implémenter une nouvelle fonctionnalité :

- analyser le code existant ;
- vérifier si la fonctionnalité existe déjà ;
- vérifier si le bug est réellement présent ;
- identifier les fichiers concernés ;
- identifier les impacts potentiels ;
- vérifier si une mise à jour Prisma est nécessaire ;
- vérifier si une mise à jour base de données est nécessaire.

Ne jamais réécrire une fonctionnalité qui existe déjà.

Toujours privilégier l'amélioration de l'existant.

Ne jamais créer une nouvelle page si une page similaire existe déjà.

Ne jamais dupliquer du code.


# VISION

BodyOps n'est pas une application de fitness.

BodyOps est un système d'exploitation du corps humain.

L'objectif n'est pas simplement :

* générer des programmes ;
* compter des calories ;
* suivre du poids.

L'objectif est d'aider une personne à atteindre une transformation physique durable grâce à :

* l'intelligence artificielle ;
* les données ;
* les habitudes ;
* la nutrition ;
* l'entraînement ;
* la motivation ;
* le coaching.

L'utilisateur doit avoir l'impression d'avoir un véritable coach personnel disponible 24h/24.

---

# PHILOSOPHIE PRODUIT

La plupart des applications fitness :

* montrent des données ;
* laissent l'utilisateur seul ;
* oublient le contexte.

BodyOps doit :

* comprendre ;
* mémoriser ;
* suivre ;
* adapter ;
* anticiper.

L'application doit devenir plus intelligente avec le temps.

---

# RÈGLE ABSOLUE

Aucune modification ne doit :

* casser Prisma ;
* casser la base de données ;
* casser les API ;
* casser les dashboards ;
* casser les rôles ;
* casser le responsive ;
* casser les intégrations futures.

---

# PROCESSUS DE DÉVELOPPEMENT OBLIGATOIRE

Pour chaque étape :

1. Analyser.
2. Résumer en 2 lignes ce qui va être fait.
3. Identifier les fichiers concernés.
4. Identifier les risques.
5. Implémenter.
6. Créer les tests.
7. Exécuter les tests.
8. Corriger.
9. Vérifier le build.
10. Valider.

Ne jamais passer à l'étape suivante si :

* les tests échouent ;
* TypeScript échoue ;
* Prisma échoue ;
* les routes échouent ;
* le responsive est cassé.

---

# PHASE 0 — STABILISATION

Objectif :

Auditer complètement le projet avant toute évolution.

Vérifier :

* routes ;
* API ;
* Prisma ;
* navigation ;
* responsive ;
* authentification ;
* rôles coach/membre ;
* IA ;
* performance ;
* sécurité.

Livrable :

* liste des bugs ;
* liste des risques ;
* plan de correction.

---

# PHASE 1 — MVP PREMIUM

## Navigation Mobile

Objectifs :

* ajouter Assistant IA dans la navigation basse ;
* améliorer le responsive ;
* améliorer l'ergonomie ;
* supprimer les éléments peu utiles si nécessaire ;
* optimiser l'utilisation à une main.

---

## Assistant IA

Objectifs :

* corriger [object Object] ;
* corriger les messages trop longs ;
* corriger les erreurs Gemini ;
* améliorer les réponses ;
* éviter les répétitions ;
* éviter "Bonjour" à chaque message ;
* utiliser la mémoire utilisateur.

---

## Architecture IA

Modèles :

1. gemini-2.5-pro
2. gemini-2.5-flash
3. gemini-2.5-flash-lite

Fallback automatique.

L'utilisateur ne doit jamais remarquer le changement.

---

## Mémoire IA

Stocker :

* historique ;
* préférences ;
* habitudes ;
* blessures ;
* objectifs ;
* aliments préférés ;
* aliments refusés ;
* exercices préférés ;
* contraintes.

L'IA ne doit jamais oublier les informations importantes.

---

## Entraînements

Corriger :

* édition séries ;
* édition répétitions ;
* édition charges ;
* édition repos ;
* édition durée ;
* chronomètre.

Tous les paramètres doivent être éditables.

---

## Bibliothèque d'exercices

Créer une bibliothèque riche.

Catégories :

* pectoraux ;
* dos ;
* épaules ;
* bras ;
* jambes ;
* fessiers ;
* abdominaux ;
* cardio ;
* mobilité.

Chaque exercice :

* image ;
* vidéo ;
* groupe musculaire ;
* matériel ;
* difficulté ;
* objectif ;
* variantes.

Exemple :

Hip Thrust :

* barre ;
* haltères ;
* machine.

Développé couché :

* barre ;
* haltères ;
* machine.

---

## Génération de programmes

Perte de poids :

* cardio intégré ;
* marche inclinée ;
* HIIT ;
* déficit.

Prise de masse :

* surcharge progressive ;
* récupération.

Recomposition :

* équilibre cardio/musculation.

Tous les paramètres :

* vitesse ;
* durée ;
* distance ;
* pente ;
* repos ;

doivent être éditables.

---

## Nutrition

Objectifs :

* repas variés ;
* rotation ;
* alternatives ;
* allergies ;
* préférences ;
* restrictions.

---

## Base alimentaire

Préparer une architecture compatible :

* USDA FoodData Central ;
* OpenFoodFacts ;
* futures bases.

Chaque aliment :

* calories ;
* protéines ;
* glucides ;
* lipides ;
* fibres ;
* sodium ;
* sucres ;
* graisses saturées.

Calcul dynamique :

15 g de riz

↓

Calories calculées automatiquement.

---

## Liste de courses

Fonctionnalités :

* regroupement ;
* catégories ;
* ajout manuel ;
* suppression ;
* export PDF ;
* export texte ;
* tout cocher ;
* réinitialiser.

---

# PHASE 2 — DIFFÉRENCIATION BODYOPS

## BodyOps Score

Créer un score :

BodyOps Score /100

Calculé à partir :

* nutrition ;
* entraînement ;
* sommeil ;
* activité ;
* progression ;
* adhérence.

---

## Habitudes

Suivi :

* eau ;
* sommeil ;
* protéines ;
* pas ;
* cardio ;
* méditation.

---

## Missions Quotidiennes

Créer :

Mission du jour

✓ 8000 pas

✓ 190 g protéines

✓ séance Push

✓ 3 L eau

✓ 7 h sommeil

L'objectif est d'augmenter l'engagement quotidien.

---

## Battle Mode

Comparer :

Utilisateur actuel

VS

Utilisateur il y a :

* 30 jours ;
* 60 jours ;
* 90 jours.

Comparer :

* poids ;
* performances ;
* adhérence ;
* cardio ;
* score.

---

## Agent Coach Personnel

L'IA doit :

* analyser ;
* relancer ;
* motiver ;
* ajuster ;
* prévenir.

Exemple :

"Tu n'as pas fait de cardio depuis 7 jours."

---

## Recovery System

Suivre :

* fatigue ;
* sommeil ;
* récupération ;
* douleurs.

L'IA peut adapter les recommandations.

---

## AI Weekly Review

Chaque semaine :

Rapport automatique :

* points forts ;
* points faibles ;
* progrès ;
* recommandations.

---

## Prévisions IA

Calculer :

* poids à 30 jours ;
* poids à 90 jours ;
* masse grasse estimée ;
* progression estimée.

---

## Knowledge Graph

Relier :

* sommeil ;
* nutrition ;
* entraînement ;
* progression ;
* habitudes.

Permettre à l'IA d'expliquer les causes d'une stagnation.

---

## Dashboard Coach Avancé

Ajouter :

* clients à risque ;
* clients sans progression ;
* clients performants ;
* alertes.

---

# PHASE 3 — PREMIUM

## Analyse Photo IA

Photos :

* face ;
* profil ;
* dos.

Comparer :

* évolution ;
* posture ;
* masse grasse estimée.

---

## Santé Connectée

Préparer l'architecture pour :

* Apple Health ;
* Health Connect ;
* Garmin ;
* Fitbit ;
* Renpho ;
* Withings ;
* Evolt.

Ne pas implémenter immédiatement.

Créer :

* interfaces ;
* providers ;
* services ;
* modèles.

---

# ARCHITECTURE IA

Les calculs critiques restent dans le code.

Ne jamais déléguer à Gemini :

* calories ;
* macros ;
* IMC ;
* TDEE ;
* BMR ;
* progression chiffrée.

Gemini sert à :

* expliquer ;
* coacher ;
* motiver ;
* personnaliser ;
* analyser.

---

# PRIORITÉ BUSINESS

Ordre absolu :

1. Programmes
2. Nutrition
3. Assistant IA
4. Progression
5. Dashboard Coach
6. Habitudes
7. BodyOps Score
8. Missions
9. Battle Mode
10. Santé connectée

---

# MIGRATIONS

Avant toute migration Prisma :

1. Sauvegarde.
2. Migration.
3. Vérification relations.
4. Vérification données.
5. Test local.

---

# TESTS OBLIGATOIRES

Après chaque étape :

* Unit Tests
* Integration Tests
* E2E Tests
* Build TypeScript
* Lint
* Prisma Validation
* API Validation
* Responsive Validation

Aucune fonctionnalité n'est considérée terminée tant que tous les tests ne passent pas.

---

# OBJECTIF FINAL

Créer une plateforme unique qui combine :

* Coach IA ;
* Nutrition ;
* Entraînement ;
* Habitudes ;
* Motivation ;
* Mémoire ;
* Analyse ;
* Progression ;
* Coaching ;
* Santé connectée.

BodyOps doit devenir le Jarvis de la transformation physique.
