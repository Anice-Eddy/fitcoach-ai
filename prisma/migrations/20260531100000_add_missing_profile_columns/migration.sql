-- Add BodyFocus enum
DO $$ BEGIN
  CREATE TYPE "BodyFocus" AS ENUM ('UPPER_BODY', 'LOWER_BODY', 'FULL_BODY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to profiles
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "bodyFocus"        "BodyFocus" DEFAULT 'FULL_BODY',
  ADD COLUMN IF NOT EXISTS "injuries"         JSONB,
  ADD COLUMN IF NOT EXISTS "aiMemoryEnabled"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "aiHistoryEnabled" BOOLEAN NOT NULL DEFAULT true;
