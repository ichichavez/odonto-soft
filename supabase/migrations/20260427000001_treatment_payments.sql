-- treatment_payments: ledger real de cuotas por item del plan de tratamiento
CREATE TABLE treatment_payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  treatment_plan_item_id  UUID REFERENCES treatment_plan_items(id) ON DELETE RESTRICT,
  receipt_number          TEXT NOT NULL,
  date                    DATE NOT NULL DEFAULT CURRENT_DATE,
  amount                  NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method                  TEXT NOT NULL DEFAULT 'efectivo',
  concept                 TEXT,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY clinic_members ON treatment_payments
  USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE INDEX ON treatment_payments (patient_id, date DESC);
CREATE INDEX ON treatment_payments (treatment_plan_item_id);
CREATE INDEX ON treatment_payments (clinic_id, receipt_number);

-- Trigger: sincroniza treatment_plan_items.payment automáticamente
CREATE OR REPLACE FUNCTION sync_treatment_plan_payment()
RETURNS TRIGGER AS $$
DECLARE item_id UUID;
BEGIN
  item_id := COALESCE(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.treatment_plan_item_id ELSE NEW.treatment_plan_item_id END,
    NULL
  );
  IF item_id IS NOT NULL THEN
    UPDATE treatment_plan_items
    SET payment = (
      SELECT COALESCE(SUM(amount), 0) FROM treatment_payments
      WHERE treatment_plan_item_id = item_id
    )
    WHERE id = item_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_treatment_payment_trigger
AFTER INSERT OR UPDATE OR DELETE ON treatment_payments
FOR EACH ROW EXECUTE FUNCTION sync_treatment_plan_payment();
