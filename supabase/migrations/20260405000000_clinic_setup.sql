-- =====================================================
-- Clinic setup: demo record, RLS policies, storage
-- =====================================================

-- 1. Insertar clínica demo
INSERT INTO clinics (id, name, slug, primary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'OdontoSoft Demo',
  'demo',
  '#10b981'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Asignar clínica demo a todos los usuarios sin clínica
UPDATE public.users
SET clinic_id = '00000000-0000-0000-0000-000000000001'
WHERE clinic_id IS NULL;

-- 3. RLS en clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinics_select"     ON clinics;
DROP POLICY IF EXISTS "clinics_insert"     ON clinics;
DROP POLICY IF EXISTS "clinics_update"     ON clinics;

CREATE POLICY "clinics_select" ON clinics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clinics_insert" ON clinics
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "clinics_update" ON clinics
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Bucket clinic-assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-assets',
  'clinic-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies del bucket
DROP POLICY IF EXISTS "clinic_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "clinic_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "clinic_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "clinic_assets_delete" ON storage.objects;

CREATE POLICY "clinic_assets_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'clinic-assets');

CREATE POLICY "clinic_assets_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');

CREATE POLICY "clinic_assets_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'clinic-assets');

CREATE POLICY "clinic_assets_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'clinic-assets');
