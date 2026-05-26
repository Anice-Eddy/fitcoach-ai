-- Remove OTHER from Gender enum (gender is MALE or FEMALE only)
UPDATE "profiles" SET "gender" = 'MALE' WHERE "gender" = 'OTHER';

ALTER TYPE "Gender" RENAME TO "Gender_old";
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
ALTER TABLE "profiles" ALTER COLUMN "gender" TYPE "Gender" USING "gender"::text::"Gender";
DROP TYPE "Gender_old";
