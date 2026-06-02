-- Add CARDIO to MuscleGroup enum (non-destructive)
ALTER TYPE "MuscleGroup" ADD VALUE IF NOT EXISTS 'CARDIO';

-- Add new Equipment values (non-destructive)
ALTER TYPE "Equipment" ADD VALUE IF NOT EXISTS 'CHEST_PRESS_MACHINE';
ALTER TYPE "Equipment" ADD VALUE IF NOT EXISTS 'HIP_THRUST_MACHINE';
