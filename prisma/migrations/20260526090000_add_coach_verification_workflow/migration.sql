-- Coach verification workflow
CREATE TYPE "CoachVerificationStatus" AS ENUM ('PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'VERIFIED', 'REJECTED');

ALTER TABLE "coach_profiles"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "verificationStatus" "CoachVerificationStatus" NOT NULL DEFAULT 'NEEDS_CORRECTION',
  ADD COLUMN "verificationIssues" JSONB,
  ADD COLUMN "verificationAnalysis" JSONB,
  ADD COLUMN "documentFileName" TEXT,
  ADD COLUMN "documentMimeType" TEXT,
  ADD COLUMN "documentSize" INTEGER,
  ADD COLUMN "documentUploadedAt" TIMESTAMP(3),
  ADD COLUMN "adminFeedback" TEXT;
