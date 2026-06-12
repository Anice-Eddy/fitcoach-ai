# Firebase Auth Migration

BodyOps keeps `users.id` as the internal primary key. Firebase Auth is used only as an identity provider.

## Current Safe Phase

Implemented:
- `User.firebaseUid` mapped to `users.firebase_uid`
- `User.authProvider` mapped to `users.auth_provider`
- `User.firebaseEmailVerified` mapped to `users.email_verified`
- `User.lastLoginAt` mapped to `users.last_login_at`
- `User.authMigratedAt` mapped to `users.auth_migrated_at`
- Firebase client SDK helpers in `lib/firebase/client.ts`
- Firebase Admin verification in `lib/firebase/admin.ts`
- `findOrCreateUserFromFirebase` in `lib/firebase/users.ts`
- Bearer-token middleware helper in `lib/firebase/server-auth.ts`
- `POST /api/auth/firebase/session`
- `GET /api/auth/firebase/me`
- `AUTH_PROVIDER=firebase|nextauth|hybrid`
- `firebase-handoff` NextAuth provider for creating the current app session after backend Firebase verification
- Login/register Firebase buttons on existing auth pages

Not changed yet:
- Existing NextAuth email/password pages remain active.
- Existing Google NextAuth login remains active.
- Existing middleware still uses NextAuth cookies.
- NextAuth is still kept as the active session layer while Firebase is rolled out.

## Feature Flag

Set:
- `AUTH_PROVIDER=hybrid`
- `NEXT_PUBLIC_AUTH_PROVIDER=hybrid`

Modes:
- `nextauth`: only existing NextAuth options are shown.
- `firebase`: only Firebase options are shown.
- `hybrid`: old NextAuth login stays active and Firebase login/register options are available.
- Business data, dashboards, coach/member roles, and payments are untouched.

## Required Environment Variables

Client:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Admin, choose one option:
- `FIREBASE_SERVICE_ACCOUNT_JSON`

or:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Never expose Admin SDK secrets with `NEXT_PUBLIC_`.

## Frontend Flow

1. Sign in/register with Firebase client SDK.
2. Call `credential.user.getIdToken()`.
3. Either:
   - call `/api/auth/firebase/session` with `Authorization: Bearer <token>`.
   - consume the returned `firebaseSessionToken` through NextAuth `firebase-handoff`.
   - for Firebase-protected routes, send `Authorization: Bearer <token>`.

## Backend Flow

1. Verify token using Firebase Admin `verifyIdToken`.
2. Resolve `uid`, `email`, `email_verified`, and provider.
3. Find BodyOps user by `firebase_uid`.
4. If missing, find by email and link `firebase_uid`.
5. If email is new, create a BodyOps user.
6. Return the BodyOps user, not the Firebase user as source of business data.

## Manual Test Checklist

- Existing email/password login still works.
- Existing Google login still works.
- Existing user can sign in with Firebase using the same email and gets linked.
- New Firebase user creates a new BodyOps user.
- `/api/auth/firebase/session` rejects missing token.
- `/api/auth/firebase/session` rejects expired/invalid token.
- `/api/auth/firebase/me` returns the BodyOps user for a valid token.
- Coach/member routes continue to work with existing NextAuth sessions.
- No user row is overwritten or deleted.

## Rollback

Safe rollback options:
- Stop using Firebase client flow and keep NextAuth pages active.
- Remove Firebase environment variables.
- Do not call `/api/auth/firebase/session`.

Database rollback, only if necessary and after backup:
- Drop `users_firebase_uid_idx`
- Drop `users_firebase_uid_key`
- Drop columns `firebase_uid`, `auth_provider`, `email_verified`, `last_login_at`, `auth_migrated_at`

Avoid DB rollback if any users have already been linked through Firebase.
