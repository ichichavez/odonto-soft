-- ============================================================
-- ODONTO-SOFT: Agregar campos de tipo de paciente
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS patient_type          TEXT DEFAULT 'adulto' CHECK (patient_type IN ('adulto', 'nino')),
  ADD COLUMN IF NOT EXISTS profession            TEXT,
  ADD COLUMN IF NOT EXISTS work_address          TEXT,
  ADD COLUMN IF NOT EXISTS work_phone            TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name         TEXT,
  ADD COLUMN IF NOT EXISTS guardian_identity_number TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone        TEXT,
  ADD COLUMN IF NOT EXISTS guardian_secondary_phone TEXT;
