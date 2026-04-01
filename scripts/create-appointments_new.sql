-- Crear una tabla completamente nueva con otro nombre
CREATE TABLE IF NOT EXISTS appointments_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    dentist_id UUID NOT NULL,
    treatment_id UUID,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 30,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_new_patient_id ON appointments_new(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_new_dentist_id ON appointments_new(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_new_date ON appointments_new(date);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_appointments_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_appointments_new_updated_at ON appointments_new;
CREATE TRIGGER update_appointments_new_updated_at
    BEFORE UPDATE ON appointments_new
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_new_updated_at();

-- Migrar datos existentes si es necesario
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        INSERT INTO appointments_new (
            id, patient_id, dentist_id, treatment_id, date, time, 
            duration, status, notes, created_at, updated_at
        )
        SELECT 
            id, patient_id, dentist_id, treatment_id, date, time, 
            COALESCE(duration, 30), 
            CASE 
                WHEN status IN ('scheduled', 'completed', 'cancelled', 'no_show') THEN status
                ELSE 'scheduled'
            END,
            notes, created_at, updated_at
        FROM appointments
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Datos migrados de appointments a appointments_new';
    END IF;
END $$;

-- Crear función RPC para insertar citas
CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id UUID,
    p_dentist_id UUID,
    p_treatment_id UUID,
    p_date DATE,
    p_time TIME,
    p_duration INTEGER DEFAULT 30,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_id UUID;
    result JSON;
BEGIN
    -- Insertar la nueva cita
    INSERT INTO appointments_new (
        patient_id, dentist_id, treatment_id, date, time, duration, status, notes
    ) VALUES (
        p_patient_id, p_dentist_id, p_treatment_id, p_date, p_time, p_duration, 'scheduled', p_notes
    ) RETURNING id INTO new_id;
    
    -- Obtener la cita completa
    SELECT row_to_json(a) INTO result
    FROM appointments_new a
    WHERE a.id = new_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Probar la función
DO $$
DECLARE
    test_patient_id UUID;
    test_dentist_id UUID;
    result JSON;
BEGIN
    -- Obtener IDs de prueba
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    SELECT id INTO test_dentist_id FROM users WHERE role IN ('dentist', 'dentista', 'admin') LIMIT 1;
    
    IF test_patient_id IS NULL OR test_dentist_id IS NULL THEN
        RAISE NOTICE 'No hay datos de prueba disponibles';
        RETURN;
    END IF;
    
    -- Probar la función
    SELECT create_appointment(
        test_patient_id, 
        test_dentist_id, 
        NULL, 
        CURRENT_DATE + 1, 
        '10:00:00', 
        30, 
        'Cita de prueba desde RPC'
    ) INTO result;
    
    RAISE NOTICE 'Resultado de prueba: %', result;
    
    -- Limpiar datos de prueba
    DELETE FROM appointments_new 
    WHERE patient_id = test_patient_id 
    AND dentist_id = test_dentist_id 
    AND notes = 'Cita de prueba desde RPC';
    
END $$;

-- Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments_new' 
ORDER BY ordinal_position;

-- Verificar que no hay restricciones CHECK
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'appointments_new'
AND con.contype = 'c';
