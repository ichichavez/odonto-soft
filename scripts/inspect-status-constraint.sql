-- Inspeccionar la restricción de status para ver qué valores acepta
DO $$
DECLARE
    constraint_def TEXT;
    test_values TEXT[] := ARRAY['scheduled', 'completed', 'cancelled', 'no_show', 'programada', 'completada', 'cancelada'];
    test_value TEXT;
    test_patient_id UUID;
    test_dentist_id UUID;
    test_appointment_id UUID;
BEGIN
    RAISE NOTICE '🔍 INSPECCIONANDO RESTRICCIÓN DE STATUS';
    
    -- Obtener la definición exacta de la restricción
    SELECT pg_get_constraintdef(con.oid) INTO constraint_def
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
    AND rel.relname = 'appointments'
    AND con.conname LIKE '%status%'
    AND con.contype = 'c';
    
    IF constraint_def IS NOT NULL THEN
        RAISE NOTICE '📋 Definición de restricción: %', constraint_def;
    ELSE
        RAISE NOTICE '❌ No se encontró restricción de status';
    END IF;
    
    -- Obtener IDs de prueba
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    SELECT id INTO test_dentist_id FROM users WHERE role IN ('dentist', 'dentista', 'admin') LIMIT 1;
    
    IF test_patient_id IS NULL OR test_dentist_id IS NULL THEN
        RAISE NOTICE '❌ No hay datos de prueba disponibles';
        RETURN;
    END IF;
    
    RAISE NOTICE '🧪 Probando diferentes valores de status...';
    
    -- Probar cada valor
    FOREACH test_value IN ARRAY test_values
    LOOP
        BEGIN
            INSERT INTO appointments (patient_id, dentist_id, date, time, duration, status)
            VALUES (test_patient_id, test_dentist_id, CURRENT_DATE + 1, '10:00:00', 30, test_value)
            RETURNING id INTO test_appointment_id;
            
            RAISE NOTICE '✅ ÉXITO con valor: "%"', test_value;
            
            -- Limpiar inmediatamente
            DELETE FROM appointments WHERE id = test_appointment_id;
            
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '❌ FALLO con valor: "%" - %', test_value, SQLERRM;
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  ERROR con valor: "%" - %', test_value, SQLERRM;
        END;
    END LOOP;
    
    -- Mostrar información de la columna
    RAISE NOTICE '📊 Información de la columna status:';
    PERFORM column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'status'
    AND table_schema = 'public';
    
END $$;

-- Mostrar todas las restricciones CHECK actuales
SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'appointments'
AND con.contype = 'c';
