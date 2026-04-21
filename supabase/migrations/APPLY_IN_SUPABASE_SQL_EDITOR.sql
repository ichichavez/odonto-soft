-- =============================================================================
-- MIGRACIONES PENDIENTES — Ejecutar en el SQL Editor de Supabase
-- Ir a: https://supabase.com/dashboard → tu proyecto → SQL Editor → New query
-- Pegar todo este archivo y ejecutarlo.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ODONTOGRAMS (tabla que almacena el odontograma interactivo por paciente)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS odontograms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{"permanent":{},"primary":{}}',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id)
);

ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_members_odontograms" ON odontograms;
DROP POLICY IF EXISTS "service_role_odontograms"   ON odontograms;

CREATE POLICY "clinic_members_odontograms" ON odontograms
  FOR ALL TO authenticated
  USING (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "service_role_odontograms" ON odontograms
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BRANCHES (sucursales)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_members_branches" ON branches;
CREATE POLICY "clinic_members_branches" ON branches
  FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- branch_id en tablas existentes (ignorar si ya existe)
ALTER TABLE patients     ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE dental_records ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DENTAL_RECORDS — columna specialty_notes JSONB
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE dental_records ADD COLUMN IF NOT EXISTS specialty_notes JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONSENT_TEMPLATES (plantillas de consentimiento por especialidad)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  specialty   TEXT NOT NULL DEFAULT 'general',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_templates_clinic ON consent_templates(clinic_id, specialty);

ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_members_consent_templates" ON consent_templates;
CREATE POLICY "clinic_members_consent_templates" ON consent_templates
  FOR ALL TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PATIENT_FILES — asegurarse de que el bucket sea público y tipos correctos
-- ─────────────────────────────────────────────────────────────────────────────

-- Hacer el bucket público (por si fue creado como privado)
UPDATE storage.buckets SET public = true WHERE id = 'patient-files';

-- Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-files', 'patient-files', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Política de lectura pública para storage
DROP POLICY IF EXISTS "patient_files_storage_select" ON storage.objects;
CREATE POLICY "patient_files_storage_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'patient-files');

-- Arreglar CHECK constraint de file_type para incluir 'interconsulta'
ALTER TABLE patient_files DROP CONSTRAINT IF EXISTS patient_files_file_type_check;
ALTER TABLE patient_files ADD CONSTRAINT patient_files_file_type_check
  CHECK (file_type IN ('radiografia','foto_intraoral','foto_extraoral','interconsulta','documento','otro'));

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN
-- =============================================================================
