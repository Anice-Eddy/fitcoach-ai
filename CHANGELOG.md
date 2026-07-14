## [1.0.2](https://github.com/Anice-Eddy/fitcoach-ai/compare/v1.0.1...v1.0.2) (2026-07-14)


### Bug Fixes

* **stripe:** lazy load webhook client ([06c825d](https://github.com/Anice-Eddy/fitcoach-ai/commit/06c825d4c1e41f440f007761a99dbfc319befaab))

## [1.0.1](https://github.com/Anice-Eddy/fitcoach-ai/compare/v1.0.0...v1.0.1) (2026-07-14)


### Bug Fixes

* **deploy:** harden production release pipeline ([2beb69d](https://github.com/Anice-Eddy/fitcoach-ai/commit/2beb69dfab0f9b71a8fef40e97a00bc85a413883))

# 1.0.0 (2026-07-14)


### Bug Fixes

* allow client accounts to become coaches ([f0482f6](https://github.com/Anice-Eddy/fitcoach-ai/commit/f0482f62170161698bb79904fc8c162b4f0d9c17))
* allow member analysis with profile only, no prior activity required ([350ae8a](https://github.com/Anice-Eddy/fitcoach-ai/commit/350ae8a88dd49ed4caeae12df45009e0f4179222))
* allow public auth recovery routes ([8a22ed6](https://github.com/Anice-Eddy/fitcoach-ai/commit/8a22ed6a614f787ed60f44a3ddbe5ada48f80f73))
* **apple-health:** token hex au lieu de base64url, parsing Bearer robuste, runtime nodejs explicite, endpoint GET de test ([7e3dfdc](https://github.com/Anice-Eddy/fitcoach-ai/commit/7e3dfdcae5f7587bcb5e081af6a70dda60fe9e8c))
* **auth:** ajouter /terms et /privacy aux routes publiques du middleware ([126f770](https://github.com/Anice-Eddy/fitcoach-ai/commit/126f770f1f73b6dd3bfd416e88278e909ddb5406))
* block cross-role signin (coach signing in as member and vice versa) ([125b6e3](https://github.com/Anice-Eddy/fitcoach-ai/commit/125b6e312f722a10c965f3b50c65be1e581d2d81))
* clarify credentials sign-in failures ([a2686b7](https://github.com/Anice-Eddy/fitcoach-ai/commit/a2686b771ea8c93441fa932eb0f57c1a6b97b83a))
* clarify forgot password account errors ([69610b2](https://github.com/Anice-Eddy/fitcoach-ai/commit/69610b26bc5f31948970e36ce59f139b872991dd))
* complete Google coach sign-in flow ([c600a70](https://github.com/Anice-Eddy/fitcoach-ai/commit/c600a705ca1fa1b57d39bd16d23242a7a10223a8))
* CTA buttons now lead to /auth/register (member/coach choice page) ([8d3542a](https://github.com/Anice-Eddy/fitcoach-ai/commit/8d3542a4bbc5d022d2465653668533c650124adf))
* **db:** correction référence table "users" dans migration ai_usage_daily ([f937f19](https://github.com/Anice-Eddy/fitcoach-ai/commit/f937f19745eaeb63f7bad12ae33b477d88fafd69))
* **db:** migration pour colonnes profiles manquantes (bodyFocus, injuries, aiMemoryEnabled, aiHistoryEnabled) ([60e5531](https://github.com/Anice-Eddy/fitcoach-ai/commit/60e5531d7e3bb3d4812220814bedfd974709a214))
* **db:** migration pour créer la table ai_usage_daily manquante ([8b100fe](https://github.com/Anice-Eddy/fitcoach-ai/commit/8b100fe4f9bc0f082acd31627806c257ff952f18))
* **deploy:** résolution migration échouée ai_usage_daily avant migrate deploy ([a47f55e](https://github.com/Anice-Eddy/fitcoach-ai/commit/a47f55e1732cd2f78e55ef81c43083c232f85519))
* **e2e:** mock coach APIs to fix coach-flow test timeout ([5741be1](https://github.com/Anice-Eddy/fitcoach-ai/commit/5741be1a23cb4314772dd7b12e42a9f78adcd478))
* **e2e:** stabilise coach-flow and auth tests for parallel execution ([ffa6541](https://github.com/Anice-Eddy/fitcoach-ai/commit/ffa65410613cd5cb6a1a050e2b68c62ab4d47729))
* enforce strict coach member separation ([d5ff973](https://github.com/Anice-Eddy/fitcoach-ai/commit/d5ff9730c9cd06a04c058f9529a39110df2a74b2))
* improve settings page layout ([2d10609](https://github.com/Anice-Eddy/fitcoach-ai/commit/2d10609c003cc363a5e160b915b87f569c2acaf1))
* increase AI max output tokens from 1600 to 3000 ([151fc89](https://github.com/Anice-Eddy/fitcoach-ai/commit/151fc89bacceb4c43feb110ea5bc0cb43c0f60cc))
* **legal:** correction politique Anthropic — logs 30j, non utilisés pour l'entraînement ([f1566df](https://github.com/Anice-Eddy/fitcoach-ai/commit/f1566dfc7d402efe59644c0383b36b2aec49d4e2))
* **legal:** suppression adresses email fictives — remplacé par référence aux Paramètres ([20a7da2](https://github.com/Anice-Eddy/fitcoach-ai/commit/20a7da210ba5dc5da502cc8744c9a14bfdcd224c))
* **lint:** suppression variable replaceExercise non utilisée ([cfff8ed](https://github.com/Anice-Eddy/fitcoach-ai/commit/cfff8edf7367916ddff3931810fb581b25ff05e1))
* **middleware:** exclure le webhook Apple Health via matcher (Bearer token auth) ([9cc2d9b](https://github.com/Anice-Eddy/fitcoach-ai/commit/9cc2d9b28c7332e1b186abf6508d470b4dad9dc7))
* optional fields truly optional + session persists 30 days ([b8579bb](https://github.com/Anice-Eddy/fitcoach-ai/commit/b8579bb10f100e003ec39804bbabf3a07e8073dc))
* prevent edge auth prisma calls ([4686041](https://github.com/Anice-Eddy/fitcoach-ai/commit/468604168a2f89ac1f48a3bbbc1a279f6525b61f))
* prioritize real coaches in coach selection ([8393e70](https://github.com/Anice-Eddy/fitcoach-ai/commit/8393e704b543b216e90f6f6b9efb118354ba626a))
* recherche insensible aux accents, exercices mélangés ([ed5db94](https://github.com/Anice-Eddy/fitcoach-ai/commit/ed5db945277df14d72b9db8e2218323c975defca))
* redirect CTA buttons to register, guard dashboard against missing profile ([4cbf2a7](https://github.com/Anice-Eddy/fitcoach-ai/commit/4cbf2a7f89451fd2def5d71240ddd4cfd0aff3a7))
* regenerate PWA icons with exact Lucide Zap shape ([127fe51](https://github.com/Anice-Eddy/fitcoach-ai/commit/127fe5140101a89cd67a81795877eaed683fc038))
* remove duplicate return block in ShopPage and unused useEffect import ([fda3d26](https://github.com/Anice-Eddy/fitcoach-ai/commit/fda3d26531faa539f783294d01fc321a0eb3026b))
* remove recent limits and route notifications ([f0d2377](https://github.com/Anice-Eddy/fitcoach-ai/commit/f0d237753c0b09601a4450a1f06b48bc001ad622))
* remove via.placeholder.com ECONNRESET errors; separate coach/athlete auth ([c69998b](https://github.com/Anice-Eddy/fitcoach-ai/commit/c69998bf492d38ae45fd34802cdf6a156b0e6223))
* resolve all SSR/client hydration mismatches from persisted Zustand stores ([3b987a2](https://github.com/Anice-Eddy/fitcoach-ai/commit/3b987a2bf2368a80887ba9d05f4ffc165f24aee5))
* resolve OAuthAccountNotLinked by healing stale account links in adapter ([f0a3a6c](https://github.com/Anice-Eddy/fitcoach-ai/commit/f0a3a6c24e475b53e558c71b9e8bc22d7cb227e3))
* resolve OAuthAccountNotLinked when Google email matches email/password account ([44e69e5](https://github.com/Anice-Eddy/fitcoach-ai/commit/44e69e5f2f1fca607c51f67ae2f0f6a3398e2811))
* restaurer Suivant ✓ et couleurs VFC/FC dans la page progression ([2f1f884](https://github.com/Anice-Eddy/fitcoach-ai/commit/2f1f884e6e43a5dcfc0e88fb1d7dfdf7ed1e5a97))
* restaurer texte 'Terminer quand même' supprimé par erreur ([c12e716](https://github.com/Anice-Eddy/fitcoach-ai/commit/c12e716cf84223d0967298823727a30dad3509ed))
* run prisma generate before next build on Vercel ([ed504ff](https://github.com/Anice-Eddy/fitcoach-ai/commit/ed504ff2366ef4b90e7f78adec33d3ce970d4836))
* show linked Google account error for coaches ([6bf5d28](https://github.com/Anice-Eddy/fitcoach-ai/commit/6bf5d280a3f60f0927b25be84001eb0e169be995))
* show precise sign-in errors ([720607b](https://github.com/Anice-Eddy/fitcoach-ai/commit/720607ba19a16e90f4c95b358fa8cb37ffe2ac00))
* stabilize ci lint and e2e workflows ([8a482dc](https://github.com/Anice-Eddy/fitcoach-ai/commit/8a482dc3b03e8ae4b254a9225657dc6f27966364))
* stabilize e2e workflow and coach booking ([42f88ba](https://github.com/Anice-Eddy/fitcoach-ai/commit/42f88bab426b64f3d50ce338097e86b591eb5f51))
* support auth email verification field ([19d213f](https://github.com/Anice-Eddy/fitcoach-ai/commit/19d213fef28fe8e9ffeabba17c49f9a320a3c7df))
* update settings preferences units ([2bcbd6a](https://github.com/Anice-Eddy/fitcoach-ai/commit/2bcbd6ac9d32a5e47edd965c93d6ed1caea3f8b5))
* use nodejs runtime for NextAuth route to avoid Edge Runtime incompatibility ([e5902ee](https://github.com/Anice-Eddy/fitcoach-ai/commit/e5902ee33b13c1e667c7dccda10fe0ad7c33c04c))
* use prod environment secrets for deployment ([a5f30dd](https://github.com/Anice-Eddy/fitcoach-ai/commit/a5f30dd59f1f5fe709e2ecf4f2e3c47680d975d4))
* **ux:** BackButton adapte le fallback selon l'état de session (connecté → dashboard, visiteur → accueil) ([ef5f0df](https://github.com/Anice-Eddy/fitcoach-ai/commit/ef5f0df5101f0faea1e38cf0632dbc3825ab977a))
* **ux:** BackButton gère le cas onglet sans historique (target="_blank") ([da0b28d](https://github.com/Anice-Eddy/fitcoach-ai/commit/da0b28d929110febd70cf16f360cb15d06f92dc2))
* **ux:** bouton retour dynamique sur pages légales + liens CGU/Confidentialité dans footer ([03347d6](https://github.com/Anice-Eddy/fitcoach-ai/commit/03347d697ed81c2c83b2d4a107186d11b26d8e49))
* **ux:** bouton retour pages légales → /dashboard au lieu de la landing page ([a049cdd](https://github.com/Anice-Eddy/fitcoach-ai/commit/a049cdd62352cf5f5fe98dc664a0ea5cafe5cdc0))
* **ux:** suppression lien "Retour à l'accueil" sur pages légales ([cb4e084](https://github.com/Anice-Eddy/fitcoach-ai/commit/cb4e084b886bcbfd30176673d909a4a4d47d10c0))


### Features

* add coach auth onboarding and exercise videos ([28e9187](https://github.com/Anice-Eddy/fitcoach-ai/commit/28e918703fa0ba951ffb20f7dbf6f1c838123632))
* add coach verification workflow ([01b675c](https://github.com/Anice-Eddy/fitcoach-ai/commit/01b675cdf201cb0551379dc97158c0f31c4bc6da))
* add comprehensive coach features - appointments, notifications, member tracking, and notes ([b604a2e](https://github.com/Anice-Eddy/fitcoach-ai/commit/b604a2ea3c076e23f31a09b2cfe104756b210c9e))
* add email/password auth, remove GitHub OAuth ([c76fa49](https://github.com/Anice-Eddy/fitcoach-ai/commit/c76fa49fbbdeffb6e93e58667e8f87399413b012))
* add firebase auth and rate limiting ([4c213cf](https://github.com/Anice-Eddy/fitcoach-ai/commit/4c213cfc8912812f10c81b749d65f912665ac2eb))
* add full test suite (unit + API + E2E) and fix TypeScript errors ([65f2390](https://github.com/Anice-Eddy/fitcoach-ai/commit/65f2390e0c45099a15dadc106cdbdf28fd415ea5))
* add multi-agent ai assistant ([e210096](https://github.com/Anice-Eddy/fitcoach-ai/commit/e210096a2d28ef968902761ccd711210e1d6773c))
* add muscleMassKg to Apple Health webhook payload ([b9cec99](https://github.com/Anice-Eddy/fitcoach-ai/commit/b9cec998b500602db39439b5ac39bb674624a06c))
* add persistent ai chat memory ([e28dc38](https://github.com/Anice-Eddy/fitcoach-ai/commit/e28dc384111c74ee00cb1e846b656c26bc980ef8))
* add PWA icons in all required sizes (72→512px) ([9f5bb78](https://github.com/Anice-Eddy/fitcoach-ai/commit/9f5bb7844f5006e51bf69f9d4024475039fd02cb)), closes [#C8F135](https://github.com/Anice-Eddy/fitcoach-ai/issues/C8F135)
* affiliate shop overhaul, YouTube exercise videos & account deletion ([f41ce59](https://github.com/Anice-Eddy/fitcoach-ai/commit/f41ce59df8ad45aa8c6a4680fc6d7a704be32b7a))
* animated background, injury tracking, body focus, shop & UI improvements ([eba20af](https://github.com/Anice-Eddy/fitcoach-ai/commit/eba20afa2cbc42b294165decd72e142ccb3a04fa))
* **apple-health:** 6 nouvelles métriques vitales + affichage membre et coach ([92a4a74](https://github.com/Anice-Eddy/fitcoach-ai/commit/92a4a74358516369f171aa75641a7bca1c255087))
* **apple-health:** token stable en base + fallback HMAC legacy ([5362554](https://github.com/Anice-Eddy/fitcoach-ai/commit/53625543592e981fd24dbbc9e37a0ae74544dee2))
* architecture IA complète BodyOps — Gemini fallback, function calling, RGPD, rate limit quotidien ([f5cabf7](https://github.com/Anice-Eddy/fitcoach-ai/commit/f5cabf748c2b4103858eb36bb273b255fdfff69e))
* **cardio:** chrono/minuteur, pente max 20, HIIT sans paramètres machine ([20fac03](https://github.com/Anice-Eddy/fitcoach-ai/commit/20fac03efd8f8abfbf22a8d3d7e9363ad7b4f1ff))
* coach pages, i18n FR/EN, editable training weights, smart rest timer, Gender fixes ([ad73a48](https://github.com/Anice-Eddy/fitcoach-ai/commit/ad73a483667fc88289f0e91373f9540aceff3862))
* coach/member space switch + Google account error handling ([85866e4](https://github.com/Anice-Eddy/fitcoach-ai/commit/85866e4530907372a60e53bc168d995aecf540d0))
* **coach:** champ pays + affichage public ville/pays/expérience ([3d07a74](https://github.com/Anice-Eddy/fitcoach-ai/commit/3d07a7406858795f54eab929631262969d3cfa1f))
* **db:** colonnes Renpho dans body_metrics + parser et API complets (BMI, graisse viscérale, eau corporelle, masse osseuse, protéines, BMR, âge métabolique…) ([5f73a7c](https://github.com/Anice-Eddy/fitcoach-ai/commit/5f73a7cdbae157400a0ed27b3b3a6a6fa80324df))
* **exercises:** +58 exercices, base passe à 140 au total ([927f974](https://github.com/Anice-Eddy/fitcoach-ai/commit/927f974155e4bf923148239b6506047a47750cb8))
* improve coach follow-up notes ([adebddf](https://github.com/Anice-Eddy/fitcoach-ai/commit/adebddf9e9a9b03d18f92301b6b0e25f75eb10bc))
* improve coach notes and scoped notifications ([7bf0696](https://github.com/Anice-Eddy/fitcoach-ai/commit/7bf0696f1887fc883aa362c6792f9bb42616c51f))
* initial commit — FitCoach AI MVP ([e779799](https://github.com/Anice-Eddy/fitcoach-ai/commit/e779799d123f55696135b97482da480419e22fb4))
* **integrations:** Apple Health via Raccourci iOS — token HMAC, webhook, UI configuration ([3bf13d4](https://github.com/Anice-Eddy/fitcoach-ai/commit/3bf13d42e8f6ae0f98d3eb76a099f3e0e59a5db5))
* **integrations:** import CSV Renpho — parser, API bulk upsert, composant UI ([6389bab](https://github.com/Anice-Eddy/fitcoach-ai/commit/6389babf5230e86de31008957c8c29a6edcca753))
* **integrations:** suppression Renpho et Evolt (pas d'API publique disponible) ([adbb574](https://github.com/Anice-Eddy/fitcoach-ai/commit/adbb574fc93f7f4ff5794b28be5ec83ffc0939be))
* onboarding step-by-step with units first, all features free ([fb09e3b](https://github.com/Anice-Eddy/fitcoach-ai/commit/fb09e3b21db8d25760a7538564a9dc6e29ac7808))
* personalize ai responses with user facts ([11314b4](https://github.com/Anice-Eddy/fitcoach-ai/commit/11314b4cd834175a406d53a4acafcb7b95039352))
* **phase1:** nav AI, 10 exercices manquants, ajout manuel shopping list ([416aff8](https://github.com/Anice-Eddy/fitcoach-ai/commit/416aff89609ff4d22d697cf1eabad79a7041112d))
* **release:** add semantic versioning workflow ([6013c66](https://github.com/Anice-Eddy/fitcoach-ai/commit/6013c66d3239fdf0641dc662b223aa2d2f1422a2))
* **shop:** barre de recherche cross-catégorie ([d83c7f2](https://github.com/Anice-Eddy/fitcoach-ai/commit/d83c7f28690f71df473f36fa5f25cef8588131ac))
* **shop:** catalogue Canada 100% indépendant du catalogue France ([0907030](https://github.com/Anice-Eddy/fitcoach-ai/commit/090703031e953951520e254290dd4fd2f2708303))
* **shop:** couleurs distinctives par catégorie sur les cartes boutique ([7ff42b2](https://github.com/Anice-Eddy/fitcoach-ai/commit/7ff42b213a4c9483f70041820c83ed795db909fa))
* **shop:** images Amazon réelles + métadonnées corrigées pour le catalogue Canada ([c3ae34e](https://github.com/Anice-Eddy/fitcoach-ai/commit/c3ae34ecf27556ee643dd257c944e0e2d08b9620))
* **shop:** navigation par catégorie — page sélection + page produits par catégorie ([c46c3ff](https://github.com/Anice-Eddy/fitcoach-ai/commit/c46c3ffa5734cb38a2c4579a6e2c18b2b51b3842))
* stabilize firebase auth i18n and deploy pipeline ([748bac8](https://github.com/Anice-Eddy/fitcoach-ai/commit/748bac8a9e56ffbe49ac87229da0fa8193b49799))
* toggle buttons, profile edit, delete account, remove subscriptions, add coaching flow ([f402c0b](https://github.com/Anice-Eddy/fitcoach-ai/commit/f402c0b003428d5a369e13be61bdf541bbfa73ec))
* **training:** +35 exercices, séries/repos éditables, vue cardio, bip RestTimer ([b451056](https://github.com/Anice-Eddy/fitcoach-ai/commit/b451056127780bd5647cedd6ad8f5d958273cd68))
* **training:** développé couché haltères alterné + générateur varié ([da56cad](https://github.com/Anice-Eddy/fitcoach-ai/commit/da56cad563c1c23e003daa3b9f84c3762fa18792))
* **training:** saisie manuelle, bouton Valider série, logs progression ([4aba7dd](https://github.com/Anice-Eddy/fitcoach-ai/commit/4aba7dd7b3234a5eaca59020284ca26254800147))
* **ux:** remplace emojis par icônes Lucide + mode focus séance entraînement ([735a100](https://github.com/Anice-Eddy/fitcoach-ai/commit/735a100f745d76955fe02cdef1f917a3acd75143))


### Performance Improvements

* cache programme 5min, éliminer refetch à chaque navigation ([f56c358](https://github.com/Anice-Eddy/fitcoach-ai/commit/f56c3581f9db4a4aec26d73ac3eed925167c7be4))
* éliminer les requêtes DB redondantes par appel API ([34dfda3](https://github.com/Anice-Eddy/fitcoach-ai/commit/34dfda302df75613fd2271f7051c0035fe808050))


### Reverts

* **deploy:** suppression du resolve temporaire dans vercel.json ([9faca4e](https://github.com/Anice-Eddy/fitcoach-ai/commit/9faca4e0d356f38cb61041cb22566f14ded2e8a5))
