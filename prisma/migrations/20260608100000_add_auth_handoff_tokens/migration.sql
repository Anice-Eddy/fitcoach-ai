-- Short-lived handoff tokens let verified Firebase logins create the existing NextAuth session.
CREATE TABLE "auth_handoff_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_handoff_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_handoff_tokens_token_key" ON "auth_handoff_tokens"("token");
CREATE INDEX "auth_handoff_tokens_userId_idx" ON "auth_handoff_tokens"("userId");
CREATE INDEX "auth_handoff_tokens_expiresAt_idx" ON "auth_handoff_tokens"("expiresAt");

ALTER TABLE "auth_handoff_tokens"
  ADD CONSTRAINT "auth_handoff_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
