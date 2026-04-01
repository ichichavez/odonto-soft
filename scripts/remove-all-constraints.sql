-- Script para eliminar TODAS las restricciones de la tabla appointments y recrearla limpia

-- Primero, obtener información sobre las restricciones existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass;

-- Eliminar todas las restricciones CHECK de la tabla appointments
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar y eliminar todas las restricciones CHECK
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'appointments'::regclass 
        AND contype = 'c'  -- 'c' significa CHECK constraint
    LOOP
        EXECUTE 'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ' || constraint_record.conname || ' CASCADE';
        RAISE NOTICE 'Eliminada restricción: %', constraint_record.conname;
    END LOOP;
END $$;

-- Verificar que no queden restricciones CHECK
SELECT 
    conname as remaining_constraints
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND contype = 'c';

-- Asegurar que la columna status sea de tipo TEXT sin restricciones
ALTER TABLE appointments ALTER COLUMN status TYPE TEXT;
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled';

-- Verificar la estructura final
\d appointments;

-- Insertar una fila de prueba para verificar que funciona
INSERT INTO appointments (
    patient_id, 
    dentist_id, 
    date, 
    time, 
    status, 
    notes
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    CURRENT_DATE + 1,
    '10:00:00',
    'scheduled',
    'Prueba después de eliminar restricciones'
);

-- Eliminar la fila de prueba
DELETE FROM appointments WHERE notes = 'Prueba después de eliminar restricciones';

SELECT 'Tabla appointments lista para usar sin restricciones CHECK' as resultado;
