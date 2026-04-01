-- ============================================================
-- ODONTO-SOFT: Módulo Ficha Odontológica Completa
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar campos a tablas existentes
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS secondary_phone TEXT;

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS consent_template TEXT DEFAULT
    'Yo, el/la abajo firmante, en pleno uso de mis facultades mentales, declaro que:

1. He sido informado/a sobre los tratamientos a realizar, sus beneficios, riesgos y alternativas.
2. Autorizo al profesional tratante a realizar los procedimientos odontológicos necesarios.
3. Declaro que toda la información médica proporcionada es verdadera y completa.
4. Entiendo que puedo retirar este consentimiento en cualquier momento antes de iniciar el tratamiento.
5. Confirmo que he tenido la oportunidad de realizar preguntas y que han sido respondidas satisfactoriamente.

La información contenida en esta ficha es estrictamente confidencial y de uso exclusivo del profesional tratante.';

-- 2. Eliminar tabla dental_records anterior (versión simple)
-- ============================================================
-- NOTA: Si tenés datos que conservar, hacer backup antes.
DROP TABLE IF EXISTS dental_records CASCADE;

-- 3. Nueva tabla dental_records (ficha odontológica completa)
-- ============================================================
CREATE TABLE dental_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id           UUID REFERENCES clinics(id),
  patient_type        TEXT NOT NULL DEFAULT 'adulto' CHECK (patient_type IN ('adulto', 'nino')),

  -- Datos de la consulta
  consultation_date   DATE DEFAULT CURRENT_DATE,
  reason_of_visit     TEXT[] DEFAULT '{}',   -- ['dolor','caries','traumatismo','control','otro']
  reason_other        TEXT,
  referred_by         TEXT,

  -- Campos exclusivos niño
  weight              DECIMAL(5,2),           -- kg
  height              DECIMAL(5,2),           -- cm
  guardian_name       TEXT,
  guardian_phone      TEXT,
  feeding_history     JSONB DEFAULT '{}',
  diet_record         JSONB DEFAULT '{}',

  -- Campos exclusivos adulto
  profession          TEXT,
  civil_status        TEXT,
  work_address        TEXT,

  -- Examen clínico (compartido)
  extra_oral_exam     JSONB DEFAULT '{}',
  intra_oral_exam     JSONB DEFAULT '{}',
  habits              JSONB DEFAULT '{}',

  -- Historia médica (adultos, aplicable también a niños)
  medical_history     JSONB DEFAULT '{}',

  -- Historia odontológica (adultos)
  dental_history      JSONB DEFAULT '{}',

  -- Odontograma inicial (se bloquea tras el primer guardado)
  odontogram_initial  JSONB DEFAULT NULL,
  odontogram_locked   BOOLEAN DEFAULT FALSE,

  -- Auditoría
  updated_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),

  -- Solo una ficha por paciente
  UNIQUE(patient_id)
);

-- 4. Historial de cambios de la ficha
-- ============================================================
CREATE TABLE IF NOT EXISTS dental_record_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dental_record_id  UUID NOT NULL REFERENCES dental_records(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL,
  snapshot          JSONB NOT NULL,    -- copia completa del registro al momento de guardar
  saved_by          UUID REFERENCES users(id),
  saved_by_name     TEXT,
  saved_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Firmas de consentimiento
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_signatures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id             UUID REFERENCES clinics(id),
  consent_text_snapshot TEXT NOT NULL,   -- copia exacta del texto firmado (inmutable)
  signed_by_name        TEXT NOT NULL,
  signed_by_ci          TEXT,
  signed_at             TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID REFERENCES users(id)
);

-- 6. Archivos y galería del paciente
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id     UUID REFERENCES clinics(id),
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL DEFAULT 'otro'
                CHECK (file_type IN ('radiografia','foto_intraoral','foto_extraoral','documento','otro')),
  file_size     INTEGER,               -- bytes
  notes         TEXT,
  taken_at      DATE,                  -- fecha de la imagen (puede diferir de created_at)
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_dental_records_patient    ON dental_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_clinic     ON dental_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dr_history_record         ON dental_record_history(dental_record_id);
CREATE INDEX IF NOT EXISTS idx_dr_history_patient        ON dental_record_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_patient           ON consent_signatures(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_patient     ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_type        ON patient_files(file_type);

-- 8. Storage buckets (ejecutar vía Supabase Dashboard > Storage)
-- ============================================================
-- Bucket: "patient-files"   → público: false, MIME: image/*, application/pdf
-- Bucket: "patient-avatars" → público: true,  MIME: image/*
-- (El bucket "clinic-assets" ya debe existir del sprint anterior)

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
