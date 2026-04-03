-- =====================================================
-- Módulos clínicos: Plan de Tratamiento y Recetas
-- =====================================================

-- Tabla: treatment_plan_items
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id    UUID REFERENCES clinics(id),
  created_by   UUID REFERENCES public.users(id),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  tooth        TEXT,
  description  TEXT NOT NULL,
  cost         DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment      DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tpi_patient ON treatment_plan_items(patient_id);
CREATE INDEX IF NOT EXISTS idx_tpi_clinic  ON treatment_plan_items(clinic_id);

-- Tabla: prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id           UUID REFERENCES clinics(id),
  created_by          UUID REFERENCES public.users(id),
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  prescription_text   TEXT,
  instructions_text   TEXT,
  signed_by_name      TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

-- Mejoras en budget_items
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS tooth TEXT;
ALTER TABLE budget_items ALTER COLUMN treatment_id DROP NOT NULL;
