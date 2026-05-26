CREATE TABLE IF NOT EXISTS "user_notes" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "category"  TEXT,
  "tags"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isPinned"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_notes_userId_fkey'
  ) THEN
    ALTER TABLE "user_notes"
      ADD CONSTRAINT "user_notes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "user_notes_userId_idx"   ON "user_notes"("userId");
CREATE INDEX IF NOT EXISTS "user_notes_isPinned_idx" ON "user_notes"("isPinned");
