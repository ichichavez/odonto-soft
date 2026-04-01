-- Crear tabla de historiales médicos
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergies TEXT,
    medications TEXT,
    chronic_diseases TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historiales dentales
CREATE TABLE IF NOT EXISTS dental_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    last_visit DATE,
    previous_treatments TEXT,
    hygiene_habits TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_records_patient_id ON dental_records(patient_id);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dental_records_updated_at 
    BEFORE UPDATE ON dental_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar registros médicos y dentales para pacientes existentes que no los tengan
INSERT INTO medical_records (patient_id, allergies, medications, chronic_diseases)
SELECT p.id, '', '', ''
FROM patients p
WHERE NOT EXISTS (
    SELECT 1 FROM medical_records mr WHERE mr.patient_id = p.id
);

INSERT INTO dental_records (patient_id, last_visit, previous_treatments, hygiene_habits, observations)
SELECT p.id, NULL, '', '', ''
FROM patients p
WHERE NOT EXISTS (
    SELECT 1 FROM dental_records dr WHERE dr.patient_id = p.id
);
