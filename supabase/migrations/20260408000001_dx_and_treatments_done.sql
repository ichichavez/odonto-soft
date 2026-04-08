-- Migration: Add diagnosis to prescriptions and treatments_done to dental_records
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE dental_records ADD COLUMN IF NOT EXISTS treatments_done JSONB DEFAULT '[]';
