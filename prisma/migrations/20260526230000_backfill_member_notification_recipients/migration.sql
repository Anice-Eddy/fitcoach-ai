-- Backfill notifications that were historically created for members without a recipient.
UPDATE "notifications" AS n
SET "recipientUserId" = a."memberId"
FROM "coach_appointments" AS a
WHERE n."relatedId" = a."id"
  AND n."recipientUserId" IS NULL
  AND (
    n."title" LIKE 'Rendez-vous:%'
    OR n."title" LIKE 'Nouveau rendez-vous:%'
    OR n."title" IN ('Rendez-vous confirmé', 'Nouvelle proposition de date', 'Note de votre coach')
  );

UPDATE "notifications" AS n
SET "recipientUserId" = cn."memberId"
FROM "coach_notes" AS cn
WHERE n."relatedId" = cn."id"
  AND n."recipientUserId" IS NULL
  AND n."title" LIKE 'Nouvelle note:%';
