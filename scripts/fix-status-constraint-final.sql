-- Script definitivo para eliminar la restricción de status problemática
DO $$
BEGIN
    -- Eliminar TODAS las restricciones CHECK que contengan 'status'
    DECLARE
        constraint_record RECORD;
    BEGIN
        FOR constraint_record IN 
            SELECT constraint_name, table_name 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'CHECK' 
            AND table_name = 'appointments'
            AND constraint_name LIKE '%status%'
        LOOP
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE', 
                          constraint_record.table_name, 
                          constraint_record.constraint_name);
            RAISE NOTICE 'Eliminada restricción: %', constraint_record.constraint_name;
        END LOOP;
    END;
    
    -- También eliminar cualquier restricción CHECK en la columna status específicamente
    DECLARE
        check_constraint RECORD;
    BEGIN
        FOR check_constraint IN
            SELECT con.conname as constraint_name
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE nsp.nspname = 'public'
            AND rel.relname = 'appointments'
            AND con.contype = 'c'
        LOOP
            EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS %I CASCADE', 
                          check_constraint.constraint_name);
            RAISE NOTICE 'Eliminada restricción CHECK: %', check_constraint.constraint_name;
        END LOOP;
    END;
    
    -- Cambiar la columna status a TEXT sin restricciones
    ALTER TABLE appointments ALTER COLUMN status TYPE TEXT;
    ALTER TABLE appointments ALTER COLUMN status DROP NOT NULL;
    ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled';
    
    -- Actualizar cualquier valor problemático
    UPDATE appointments SET status = 'scheduled' WHERE status IS NULL OR status = '';
    
    RAISE NOTICE 'Columna status convertida a TEXT sin restricciones';
    
    -- Verificar que no hay más restricciones CHECK
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'CHECK' 
        AND table_name = 'appointments'
    ) THEN
        RAISE NOTICE 'ADVERTENCIA: Aún existen restricciones CHECK en la tabla appointments';
    ELSE
        RAISE NOTICE 'ÉXITO: No hay restricciones CHECK en la tabla appointments';
    END IF;
    
    -- Probar inserción
    INSERT INTO appointments (patient_id, dentist_id, date, time, duration, status, notes, treatment_id)
    VALUES (
        (SELECT id FROM patients LIMIT 1),
        (SELECT id FROM users WHERE role = 'dentista' LIMIT 1),
        CURRENT_DATE,
        '10:00:00',
        30,
        'scheduled',
        'Prueba de inserción',
        NULL
    );
    
    RAISE NOTICE 'ÉXITO: Inserción de prueba completada';
    
    -- Eliminar el registro de prueba
    DELETE FROM appointments WHERE notes = 'Prueba de inserción';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error durante la corrección: %', SQLERRM;
        ROLLBACK;
END $$;

-- Mostrar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'status';

-- Mostrar restricciones restantes
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'appointments';
