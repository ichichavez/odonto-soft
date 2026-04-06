-- =====================================================
-- Tabla de gastos / egresos de la clínica
-- =====================================================

CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id      UUID REFERENCES clinics(id),
  created_by     UUID REFERENCES public.users(id),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  category       TEXT NOT NULL DEFAULT 'otro'
                 CHECK (category IN (
                   'material_dental','equipo','alquiler','salario',
                   'servicios','limpieza','marketing','otro'
                 )),
  description    TEXT NOT NULL,
  amount         DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'efectivo'
                 CHECK (payment_method IN ('efectivo','transferencia','tarjeta','cheque')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_clinic  ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(date);

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO authenticated USING (true);
