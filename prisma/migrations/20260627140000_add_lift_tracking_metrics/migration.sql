-- Add optional velocity and bar-path metrics captured during a workout set.
ALTER TABLE "exercise_logs"
ADD COLUMN "velocity_peak_mps" DOUBLE PRECISION,
ADD COLUMN "velocity_avg_mps" DOUBLE PRECISION,
ADD COLUMN "bar_path_deviation_cm" DOUBLE PRECISION,
ADD COLUMN "bar_path_points" JSONB;
