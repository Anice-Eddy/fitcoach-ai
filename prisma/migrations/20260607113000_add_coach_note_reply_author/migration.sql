-- Allow coach and member replies to share the same note thread without losing existing member replies.
ALTER TABLE "coach_note_replies"
  ADD COLUMN "authorUserId" TEXT,
  ADD COLUMN "authorRole" TEXT NOT NULL DEFAULT 'MEMBER',
  ALTER COLUMN "memberId" DROP NOT NULL;

UPDATE "coach_note_replies"
SET "authorUserId" = "memberId",
    "authorRole" = 'MEMBER'
WHERE "authorUserId" IS NULL
  AND "memberId" IS NOT NULL;

CREATE INDEX "coach_note_replies_authorUserId_idx" ON "coach_note_replies"("authorUserId");

ALTER TABLE "coach_note_replies"
  ADD CONSTRAINT "coach_note_replies_authorUserId_fkey"
  FOREIGN KEY ("authorUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
