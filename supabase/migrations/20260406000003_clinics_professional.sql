-- Campos de identificación profesional y contacto para el membrete de documentos
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS doctor_name              TEXT,
  ADD COLUMN IF NOT EXISTS specialty                TEXT,
  ADD COLUMN IF NOT EXISTS professional_registration TEXT,
  ADD COLUMN IF NOT EXISTS signature_url            TEXT,
  ADD COLUMN IF NOT EXISTS address                  TEXT,
  ADD COLUMN IF NOT EXISTS phone                    TEXT;
