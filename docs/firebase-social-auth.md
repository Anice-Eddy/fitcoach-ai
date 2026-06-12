# Firebase Social Auth

BodyOps utilise NextAuth comme gestionnaire de session principal. Firebase Auth sert uniquement aux connexions sociales Google et Facebook.

## Firebase Console

1. Ouvrir Firebase Console.
2. Sélectionner le projet BodyOps.
3. Aller dans Authentication puis Sign-in method.
4. Activer uniquement Google et Facebook.
5. Dans Project settings puis General, copier la configuration Web dans les variables `NEXT_PUBLIC_FIREBASE_*`.
6. Dans Project settings puis Service accounts, générer une clé privée Admin SDK.
7. Mettre soit le JSON complet dans `FIREBASE_SERVICE_ACCOUNT_JSON`, soit remplir `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` et `FIREBASE_ADMIN_PRIVATE_KEY`.

## Facebook Developer Console

1. Créer une app Facebook de type Consumer.
2. Ajouter le produit Facebook Login.
3. Configurer les OAuth Redirect URIs :
   - `http://localhost:3000/__/auth/handler`
   - `https://TON_DOMAINE/__/auth/handler`
4. Copier l'App ID dans `NEXT_PUBLIC_FACEBOOK_APP_ID`.
5. Copier l'App Secret dans `FACEBOOK_APP_SECRET`.
6. Coller aussi l'App ID et l'App Secret dans le provider Facebook de Firebase Console.

## Variables Vercel

Ajouter en production :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NEXT_PUBLIC_FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
AUTH_PROVIDER=hybrid
NEXT_PUBLIC_AUTH_PROVIDER=hybrid
```

## Tests Manuels

1. Mettre `AUTH_PROVIDER=hybrid` et `NEXT_PUBLIC_AUTH_PROVIDER=hybrid`.
2. Démarrer l'app.
3. Tester "Continuer avec Google".
4. Vérifier la redirection vers `/dashboard`.
5. Vérifier que l'utilisateur existe dans Prisma avec `firebase_uid`.
6. Tester "Continuer avec Facebook".
7. Vérifier qu'aucun bouton Apple Sign In n'apparaît.
8. Vérifier que l'ancien email/password fonctionne toujours.
