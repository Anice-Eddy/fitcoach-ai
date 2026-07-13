# Firebase Social Auth

BodyOps uses Firebase Auth as the user-facing identity provider. NextAuth remains the internal session/cookie layer for existing routes and middleware.

## Firebase Console

1. Open Firebase Console.
2. Select the BodyOps project.
3. Go to Authentication then Sign-in method.
4. Enable Google and Facebook.
5. From Project settings then General, copy the Web app config into `NEXT_PUBLIC_FIREBASE_*`.
6. From Project settings then Service accounts, generate an Admin SDK private key.
7. Either set the full JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`, or set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`.

## Facebook Developer Console

1. Create a Consumer Facebook app.
2. Add the Facebook Login product.
3. Configure the OAuth Redirect URIs:
   - `http://localhost:3000/__/auth/handler`
   - `https://YOUR_DOMAIN/__/auth/handler`
4. Copy the App ID into `NEXT_PUBLIC_FACEBOOK_APP_ID`.
5. Copy the App Secret into `FACEBOOK_APP_SECRET`.
6. Also paste the App ID and App Secret into the Facebook provider in Firebase Console.

## Vercel Variables

Add in production:

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
AUTH_PROVIDER=firebase
NEXT_PUBLIC_AUTH_PROVIDER=firebase
```

## Manual Tests

1. Set `AUTH_PROVIDER=firebase` and `NEXT_PUBLIC_AUTH_PROVIDER=firebase`.
2. Start the app.
3. Test "Continue with Google".
4. Verify the redirect to `/dashboard`.
5. Verify the user exists in Prisma with `firebase_uid`.
6. Test "Continue with Facebook".
7. Verify no Apple Sign In button appears.
8. Verify Firebase email/password still works.
