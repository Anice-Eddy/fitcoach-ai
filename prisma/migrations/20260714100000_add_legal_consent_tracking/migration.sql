ALTER TABLE "public"."users"
ADD COLUMN "terms_accepted_at" TIMESTAMP(3),
ADD COLUMN "privacy_accepted_at" TIMESTAMP(3),
ADD COLUMN "legal_policy_version" TEXT,
ADD COLUMN "legal_consent_locale" TEXT;

ALTER TABLE "public"."profiles"
ADD COLUMN "health_data_consent_at" TIMESTAMP(3),
ADD COLUMN "health_data_consent_version" TEXT,
ADD COLUMN "health_data_consent_locale" TEXT;
