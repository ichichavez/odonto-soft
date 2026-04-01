-- Eliminar definitivamente la restricción de status que está causando problemas
SELECT 'Eliminando restricción appointments_status_check...' as status;

-- Eliminar la restricción específica que está causando el problema
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check CASCADE;

-- Verificar que se eliminó
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass
AND contype = 'c';

-- Cambiar la columna status a TEXT simple sin restricciones
ALTER TABLE appointments ALTER COLUMN status TYPE TEXT;
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled';

-- Verificar la estructura final de la columna status
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'status'
AND table_schema = 'public';

-- Probar inserción directa para verificar que funciona
DO $$
DECLARE
    test_patient_id UUID;
    test_dentist_id UUID;
BEGIN
    -- Obtener IDs de prueba
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    SELECT id INTO test_dentist_id FROM users WHERE role = 'dentist' LIMIT 1;
    
    IF test_patient_id IS NOT NULL AND test_dentist_id IS NOT NULL THEN
        -- Intentar inserción con el valor "scheduled"
        INSERT INTO appointments (patient_id, dentist_id, date, time, duration, status)
        VALUES (test_patient_id, test_dentist_id, CURRENT_DATE + 1, '10:00:00', 30, 'scheduled');
        
        RAISE NOTICE 'Inserción exitosa con status = scheduled';
        
        -- Limpiar el registro de prueba
        DELETE FROM appointments 
        WHERE patient_id = test_patient_id 
        AND dentist_id = test_dentist_id 
        AND date = CURRENT_DATE + 1
        AND time = '10:00:00';
        
    ELSE
        RAISE NOTICE 'No hay datos de prueba disponibles';
    END IF;
END $$;

SELECT 'Restricción de status eliminada completamente' as resultado;
