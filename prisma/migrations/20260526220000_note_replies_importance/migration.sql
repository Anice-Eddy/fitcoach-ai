-- Add isImportant flag to coach_notes
ALTER TABLE "coach_notes" ADD COLUMN IF NOT EXISTS "isImportant" BOOLEAN NOT NULL DEFAULT false;

-- Create coach_note_replies table
CREATE TABLE IF NOT EXISTS "coach_note_replies" (
  "id"        TEXT        NOT NULL,
  "noteId"    TEXT        NOT NULL,
  "memberId"  TEXT        NOT NULL,
  "content"   TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coach_note_replies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coach_note_replies_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "coach_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coach_note_replies_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "coach_note_replies_noteId_idx"   ON "coach_note_replies"("noteId");
CREATE INDEX IF NOT EXISTS "coach_note_replies_memberId_idx" ON "coach_note_replies"("memberId");
