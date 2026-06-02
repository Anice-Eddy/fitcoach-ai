-- Journal nutritionnel quotidien réellement consommé.
-- Migration non destructive : aucune donnée existante n'est modifiée.
CREATE TABLE IF NOT EXISTS "nutrition_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'PLANNED',
    "mealType" "MealType",
    "name" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "items" JSONB,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "nutrition_logs_userId_date_clientKey_key"
  ON "nutrition_logs"("userId", "date", "clientKey");

CREATE INDEX IF NOT EXISTS "nutrition_logs_userId_date_idx"
  ON "nutrition_logs"("userId", "date");

CREATE INDEX IF NOT EXISTS "nutrition_logs_userId_loggedAt_idx"
  ON "nutrition_logs"("userId", "loggedAt");

DO $$ BEGIN
  ALTER TABLE "nutrition_logs"
    ADD CONSTRAINT "nutrition_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
