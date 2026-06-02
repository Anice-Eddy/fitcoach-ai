-- Nouvelles colonnes Apple Health dans body_metrics (non-destructif)
-- heartRateAvg et caloriesActive migrent des notes vers des colonnes dédiées.
-- restingHeartRate, vo2Max, hrv, spo2 sont des données Apple Watch avancées.

ALTER TABLE "body_metrics"
  ADD COLUMN IF NOT EXISTS "heartRateAvg"     INTEGER,
  ADD COLUMN IF NOT EXISTS "caloriesActive"   INTEGER,
  ADD COLUMN IF NOT EXISTS "restingHeartRate" INTEGER,
  ADD COLUMN IF NOT EXISTS "vo2Max"           DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "hrv"              DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "spo2"             DOUBLE PRECISION;
