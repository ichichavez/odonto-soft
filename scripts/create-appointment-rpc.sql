-- Crear función RPC para insertar citas como alternativa
CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id UUID,
    p_dentist_id UUID,
    p_date DATE,
    p_time TIME,
    p_duration INTEGER DEFAULT 30,
    p_status TEXT DEFAULT 'scheduled',
    p_notes TEXT DEFAULT NULL,
    p_treatment_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    patient_id UUID,
    dentist_id UUID,
    treatment_id UUID,
    date DATE,
    time TIME,
    duration INTEGER,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_id UUID;
BEGIN
    -- Generar nuevo ID
    new_id := gen_random_uuid();
    
    -- Insertar directamente sin restricciones
    INSERT INTO appointments (
        id,
        patient_id,
        dentist_id,
        treatment_id,
        date,
        time,
        duration,
        status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        new_id,
        p_patient_id,
        p_dentist_id,
        p_treatment_id,
        p_date,
        p_time,
        p_duration,
        p_status,
        p_notes,
        NOW(),
        NOW()
    );
    
    -- Retornar el registro creado
    RETURN QUERY
    SELECT 
        a.id,
        a.patient_id,
        a.dentist_id,
        a.treatment_id,
        a.date,
        a.time,
        a.duration,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
    FROM appointments a
    WHERE a.id = new_id;
END;
$$;

-- Verificar que la función se creó correctamente
SELECT 'Función create_appointment creada exitosamente' as resultado;

-- Probar la función
SELECT * FROM create_appointment(
    gen_random_uuid(),
    gen_random_uuid(),
    CURRENT_DATE + 1,
    '10:00:00'::TIME,
    30,
    'scheduled',
    'Prueba de función RPC',
    NULL
);

-- Limpiar la prueba
DELETE FROM appointments WHERE notes = 'Prueba de función RPC';
