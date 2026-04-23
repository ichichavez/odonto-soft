-- Agrega campos barrio y ciudad al registro de pacientes
ALTER TABLE patients ADD COLUMN IF NOT EXISTS barrio TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ciudad TEXT;
