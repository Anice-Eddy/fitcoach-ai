DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'FACEBOOK'
      AND enumtypid = '"Provider"'::regtype
  ) THEN
    ALTER TYPE "Provider" ADD VALUE 'FACEBOOK';
  END IF;
END $$;
