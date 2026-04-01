-- Inspeccionar completamente la tabla appointments
SELECT 'Inspeccionando tabla appointments...' as status;

-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver todas las restricciones
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'appointments' 
AND tc.table_schema = 'public';

-- Ver índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'appointments' 
AND schemaname = 'public';

-- Ver triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'appointments' 
AND event_object_schema = 'public';

-- Intentar una inserción de prueba para ver el error exacto
DO $$
DECLARE
    test_patient_id UUID;
    test_dentist_id UUID;
    error_message TEXT;
BEGIN
    -- Obtener un paciente existente
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    
    -- Obtener un dentista existente
    SELECT id INTO test_dentist_id FROM users WHERE role = 'dentist' LIMIT 1;
    
    IF test_patient_id IS NULL THEN
        RAISE NOTICE 'No hay pacientes en la base de datos';
        RETURN;
    END IF;
    
    IF test_dentist_id IS NULL THEN
        RAISE NOTICE 'No hay dentistas en la base de datos';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Paciente de prueba: %', test_patient_id;
    RAISE NOTICE 'Dentista de prueba: %', test_dentist_id;
    
    -- Intentar inserción básica
    BEGIN
        INSERT INTO appointments (patient_id, dentist_id, date, time)
        VALUES (test_patient_id, test_dentist_id, CURRENT_DATE + 1, '10:00:00');
        
        RAISE NOTICE 'Inserción exitosa - eliminando registro de prueba';
        DELETE FROM appointments 
        WHERE patient_id = test_patient_id 
        AND dentist_id = test_dentist_id 
        AND date = CURRENT_DATE + 1;
        
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
        RAISE NOTICE 'ERROR EN INSERCIÓN: %', error_message;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
END $$;

SELECT 'Inspección completada' as resultado;
