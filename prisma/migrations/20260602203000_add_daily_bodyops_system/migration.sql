-- Fondation Habitudes / Missions quotidiennes / BodyOps Score.
-- Migration non destructive : ajoute uniquement de nouvelles tables et enums.
DO $$ BEGIN
  CREATE TYPE "HabitType" AS ENUM ('WATER', 'SLEEP', 'PROTEIN', 'STEPS', 'CARDIO', 'MEDITATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MissionType" AS ENUM ('HABIT', 'NUTRITION', 'TRAINING', 'RECOVERY', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "daily_habit_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "type" "HabitType" NOT NULL,
  "targetValue" DOUBLE PRECISION,
  "actualValue" DOUBLE PRECISION,
  "unit" TEXT,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'USER',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_habit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "daily_missions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "MissionType" NOT NULL,
  "targetValue" DOUBLE PRECISION,
  "actualValue" DOUBLE PRECISION,
  "unit" TEXT,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_missions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bodyops_scores" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "nutritionScore" INTEGER NOT NULL DEFAULT 0,
  "trainingScore" INTEGER NOT NULL DEFAULT 0,
  "recoveryScore" INTEGER NOT NULL DEFAULT 0,
  "habitScore" INTEGER NOT NULL DEFAULT 0,
  "progressionScore" INTEGER NOT NULL DEFAULT 0,
  "activityScore" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bodyops_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_habit_logs_userId_date_type_key" ON "daily_habit_logs"("userId", "date", "type");
CREATE INDEX IF NOT EXISTS "daily_habit_logs_userId_date_idx" ON "daily_habit_logs"("userId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "daily_missions_userId_date_key_key" ON "daily_missions"("userId", "date", "key");
CREATE INDEX IF NOT EXISTS "daily_missions_userId_date_idx" ON "daily_missions"("userId", "date");

CREATE UNIQUE INDEX IF NOT EXISTS "bodyops_scores_userId_date_key" ON "bodyops_scores"("userId", "date");
CREATE INDEX IF NOT EXISTS "bodyops_scores_userId_date_idx" ON "bodyops_scores"("userId", "date");

DO $$ BEGIN
  ALTER TABLE "daily_habit_logs" ADD CONSTRAINT "daily_habit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "daily_missions" ADD CONSTRAINT "daily_missions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "bodyops_scores" ADD CONSTRAINT "bodyops_scores_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
