-- Odontograma interactivo por paciente (uno acumulativo por paciente)
CREATE TABLE IF NOT EXISTS odontograms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  -- data = {
  --   permanent: { "11": { surfaces: { O:"caries", V:"sano" }, whole: null }, "46": { whole:"extraido" } },
  --   primary:   { "51": { surfaces: { O:"obturado" } } }
  -- }
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id)
);

ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;

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
