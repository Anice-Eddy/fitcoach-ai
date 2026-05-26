-- Add recipientUserId to notifications to distinguish coach vs member notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "recipientUserId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_recipientUserId_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_recipientUserId_fkey"
      FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_recipientUserId_idx" ON "notifications"("recipientUserId");
