-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_scope_keyHash_windowStart_key"
ON "rate_limit_buckets"("scope", "keyHash", "windowStart");
