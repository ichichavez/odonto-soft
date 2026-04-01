-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS create_appointment(UUID, UUID, UUID, DATE, TIME, INTEGER, TEXT);

-- Crear función RPC simplificada
CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id UUID,
    p_dentist_id UUID,
    p_treatment_id UUID DEFAULT NULL,
    p_date DATE,
    p_time TIME,
    p_duration INTEGER DEFAULT 30,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_appointment RECORD;
    result JSON;
BEGIN
    -- Log de entrada
    RAISE NOTICE 'Creando cita: patient=%, dentist=%, date=%, time=%', 
        p_patient_id, p_dentist_id, p_date, p_time;
    
    -- Verificar que existen los IDs referenciados
    IF NOT EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id) THEN
        RETURN json_build_object('error', 'Paciente no encontrado', 'patient_id', p_patient_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_dentist_id) THEN
        RETURN json_build_object('error', 'Dentista no encontrado', 'dentist_id', p_dentist_id);
    END IF;
    
    -- Intentar insertar en appointments_new primero
    BEGIN
        INSERT INTO appointments_new (
            patient_id, 
            dentist_id, 
            treatment_id, 
            date, 
            time, 
            duration, 
            status, 
            notes
        ) VALUES (
            p_patient_id, 
            p_dentist_id, 
            p_treatment_id, 
            p_date, 
            p_time, 
            p_duration, 
            'scheduled', 
            p_notes
        ) RETURNING * INTO new_appointment;
        
        RAISE NOTICE 'Cita creada en appointments_new con ID: %', new_appointment.id;
        
    EXCEPTION
        WHEN undefined_table THEN
            -- Si appointments_new no existe, usar appointments
            RAISE NOTICE 'appointments_new no existe, usando appointments';
            
            INSERT INTO appointments (
                patient_id, 
                dentist_id, 
                treatment_id, 
                date, 
                time, 
                duration, 
                status, 
                notes
            ) VALUES (
                p_patient_id, 
                p_dentist_id, 
                p_treatment_id, 
                p_date, 
                p_time, 
                p_duration, 
                'scheduled', 
                p_notes
            ) RETURNING * INTO new_appointment;
            
            RAISE NOTICE 'Cita creada en appointments con ID: %', new_appointment.id;
    END;
    
    -- Convertir el resultado a JSON
    SELECT row_to_json(new_appointment) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en create_appointment: % - %', SQLSTATE, SQLERRM;
        RETURN json_build_object(
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'detail', 'Error al crear la cita'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se creó correctamente
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_appointment' 
AND routine_schema = 'public';

-- Probar la función con datos de ejemplo (comentado para evitar errores)
-- SELECT create_appointment(
--     (SELECT id FROM patients LIMIT 1),
--     (SELECT id FROM users WHERE role = 'dentist' LIMIT 1),
--     NULL,
--     CURRENT_DATE,
--     '10:00'::TIME,
--     30,
--     'Cita de prueba'
-- );

RAISE NOTICE 'Función create_appointment creada exitosamente ✅';
