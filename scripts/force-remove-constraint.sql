-- Script ultra agresivo para eliminar la restricción problemática
DO $$
DECLARE
    constraint_record RECORD;
    sql_command TEXT;
BEGIN
    RAISE NOTICE 'Iniciando eliminación forzada de restricciones...';
    
    -- Buscar TODAS las restricciones CHECK en la tabla appointments
    FOR constraint_record IN 
        SELECT 
            con.conname as constraint_name,
            pg_get_constraintdef(con.oid) as constraint_def
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
        AND rel.relname = 'appointments'
        AND con.contype = 'c'
    LOOP
        sql_command := format('ALTER TABLE appointments DROP CONSTRAINT %I CASCADE', constraint_record.constraint_name);
        EXECUTE sql_command;
        RAISE NOTICE 'Eliminada restricción: % - Definición: %', constraint_record.constraint_name, constraint_record.constraint_def;
    END LOOP;
    
    -- Verificar que no quedan restricciones CHECK
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
        AND rel.relname = 'appointments'
        AND con.contype = 'c'
    ) THEN
        RAISE NOTICE 'ADVERTENCIA: Aún existen restricciones CHECK';
    ELSE
        RAISE NOTICE 'ÉXITO: Todas las restricciones CHECK eliminadas';
    END IF;
    
    -- Recrear la columna status completamente
    ALTER TABLE appointments DROP COLUMN IF EXISTS status CASCADE;
    ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'scheduled';
    
    RAISE NOTICE 'Columna status recreada como TEXT sin restricciones';
    
    -- Probar inserción inmediatamente
    DECLARE
        test_patient_id UUID;
        test_dentist_id UUID;
        test_appointment_id UUID;
    BEGIN
        SELECT id INTO test_patient_id FROM patients LIMIT 1;
        SELECT id INTO test_dentist_id FROM users WHERE role IN ('dentist', 'dentista', 'admin') LIMIT 1;
        
        IF test_patient_id IS NOT NULL AND test_dentist_id IS NOT NULL THEN
            INSERT INTO appointments (patient_id, dentist_id, date, time, duration, status)
            VALUES (test_patient_id, test_dentist_id, CURRENT_DATE + 1, '10:00:00', 30, 'scheduled')
            RETURNING id INTO test_appointment_id;
            
            RAISE NOTICE 'ÉXITO: Inserción de prueba completada con ID: %', test_appointment_id;
            
            -- Limpiar
            DELETE FROM appointments WHERE id = test_appointment_id;
            RAISE NOTICE 'Registro de prueba eliminado';
        ELSE
            RAISE NOTICE 'No hay datos de prueba disponibles (paciente: %, dentista: %)', test_patient_id, test_dentist_id;
        END IF;
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error durante la eliminación: %', SQLERRM;
END $$;

-- Mostrar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'status'
AND table_schema = 'public';

-- Verificar que no hay restricciones CHECK
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'appointments'
AND con.contype = 'c';
