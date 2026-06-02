-- Ajout du pays dans le profil coach (non-destructif)
ALTER TABLE "coach_profiles"
  ADD COLUMN IF NOT EXISTS "country" TEXT;
