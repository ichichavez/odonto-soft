-- Script completo para corregir la restricción de status en appointments
DO $$
DECLARE
    constraint_exists boolean := false;
BEGIN
    -- Verificar si la tabla appointments existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
        RAISE NOTICE 'La tabla appointments no existe. Creándola...';
        
        CREATE TABLE appointments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID NOT NULL,
            dentist_id UUID NOT NULL,
            treatment_id UUID,
            date DATE NOT NULL,
            time TIME NOT NULL,
            duration INTEGER DEFAULT 30,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Verificar si existe alguna restricción de status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%status%' 
        AND table_name = 'appointments'
        AND constraint_type = 'CHECK'
    ) INTO constraint_exists;

    -- Eliminar todas las restricciones de status existentes
    IF constraint_exists THEN
        RAISE NOTICE 'Eliminando restricciones de status existentes...';
        
        -- Eliminar restricciones específicas que podrían existir
        BEGIN
            ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo eliminar appointments_status_check: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE appointments DROP CONSTRAINT IF EXISTS check_status;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo eliminar check_status: %', SQLERRM;
        END;
        
        BEGIN
            ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo eliminar appointments_status_check1: %', SQLERRM;
        END;
    END IF;

    -- Verificar si la columna status existe, si no, crearla
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'Agregando columna status...';
        ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'scheduled';
    END IF;

    -- Actualizar valores inválidos existentes
    RAISE NOTICE 'Actualizando valores de status inválidos...';
    UPDATE appointments 
    SET status = 'scheduled' 
    WHERE status IS NULL 
       OR status NOT IN ('scheduled', 'completed', 'cancelled', 'no_show');

    -- Crear la nueva restricción correcta
    RAISE NOTICE 'Creando nueva restricción de status...';
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_status_valid 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'));

    -- Crear trigger para updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_appointments_updated_at'
    ) THEN
        RAISE NOTICE 'Creando trigger para updated_at...';
        
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_appointments_updated_at
            BEFORE UPDATE ON appointments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    RAISE NOTICE 'Restricción de status corregida exitosamente';
    RAISE NOTICE 'Valores válidos: scheduled, completed, cancelled, no_show';
END $$;

-- Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;
