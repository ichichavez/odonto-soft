-- =====================================================
-- Tabla patient_files + bucket patient-files
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES clinics(id),
  uploaded_by UUID REFERENCES public.users(id),
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL DEFAULT 'otro'
              CHECK (file_type IN ('radiografia','foto_intraoral','foto_extraoral','documento','otro')),
  file_size   INTEGER,
  notes       TEXT,
  taken_at    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_files_patient ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_clinic  ON patient_files(clinic_id);

-- RLS
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_files_select" ON patient_files;
DROP POLICY IF EXISTS "patient_files_insert" ON patient_files;
DROP POLICY IF EXISTS "patient_files_delete" ON patient_files;

CREATE POLICY "patient_files_select" ON patient_files
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "patient_files_insert" ON patient_files
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "patient_files_delete" ON patient_files
  FOR DELETE TO authenticated USING (true);

-- Bucket patient-files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-files', 'patient-files', true, 20971520)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "patient_files_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "patient_files_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "patient_files_storage_delete" ON storage.objects;

CREATE POLICY "patient_files_storage_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'patient-files');

CREATE POLICY "patient_files_storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "patient_files_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'patient-files');
