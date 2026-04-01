-- Recrear la tabla appointments de forma simple y limpia
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    dentist_id UUID NOT NULL,
    treatment_id UUID,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos datos de prueba si no existen usuarios y pacientes
-- (esto es opcional, solo para testing)
INSERT INTO appointments (patient_id, dentist_id, date, time, status, notes) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    'scheduled',
    'Cita de prueba'
WHERE NOT EXISTS (SELECT 1 FROM appointments LIMIT 1);

-- Verificar la estructura
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;
