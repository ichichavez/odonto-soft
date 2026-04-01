-- Corregir la restricción de status en la tabla appointments
DO $$
BEGIN
    -- Primero, eliminar la restricción existente si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_status_check' 
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
    END IF;

    -- Crear la nueva restricción con los valores correctos
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'));

    -- Actualizar cualquier valor inválido existente
    UPDATE appointments 
    SET status = 'scheduled' 
    WHERE status NOT IN ('scheduled', 'completed', 'cancelled', 'no_show');

    RAISE NOTICE 'Restricción de status corregida exitosamente';
END $$;
