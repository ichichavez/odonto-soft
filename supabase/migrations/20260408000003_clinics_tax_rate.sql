-- Agrega tasa de impuesto configurable por clínica (por defecto 10 %)
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 10;
