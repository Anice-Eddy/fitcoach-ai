-- AlterTable: add optional fields to coach_profiles
ALTER TABLE "coach_profiles" ADD COLUMN IF NOT EXISTS "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "coach_profiles" ADD COLUMN IF NOT EXISTS "yearsExperience" INTEGER;
ALTER TABLE "coach_profiles" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "coach_profiles" ADD COLUMN IF NOT EXISTS "phone" TEXT;
