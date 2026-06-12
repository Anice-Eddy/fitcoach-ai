-- Firebase Auth is identity-only: BodyOps keeps users.id as the internal primary key.
ALTER TABLE "users"
  ADD COLUMN "firebase_uid" TEXT,
  ADD COLUMN "auth_provider" TEXT,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "last_login_at" TIMESTAMP(3),
  ADD COLUMN "auth_migrated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");
CREATE INDEX "users_firebase_uid_idx" ON "users"("firebase_uid");
