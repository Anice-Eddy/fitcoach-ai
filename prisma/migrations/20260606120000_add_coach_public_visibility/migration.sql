-- Add coach-controlled public visibility settings without changing existing data.
ALTER TABLE "coach_profiles"
ADD COLUMN "showMemberCount" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showYearsExperience" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "publicRating" DOUBLE PRECISION,
ADD COLUMN "publicRatingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "showPublicRating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "discoveryCallEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "discoveryCallTitle" TEXT NOT NULL DEFAULT 'Entretien découverte',
ADD COLUMN "discoveryCallDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "showDiscoveryCall" BOOLEAN NOT NULL DEFAULT true;
