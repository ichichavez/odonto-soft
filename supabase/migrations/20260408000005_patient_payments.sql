-- Historial de pagos por paciente
CREATE TABLE IF NOT EXISTS patient_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC(12, 2) NOT NULL,
  method      TEXT NOT NULL DEFAULT 'efectivo',
  concept     TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patient_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_members_patient_payments"
  ON patient_payments FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_patient_payments_patient_id
  ON patient_payments (patient_id, date DESC);
