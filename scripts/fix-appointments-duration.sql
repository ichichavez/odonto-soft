-- Corregir la tabla appointments para manejar la duración correctamente
DO $$
BEGIN
    -- Verificar si la columna duration existe y es NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'duration' 
        AND is_nullable = 'NO'
    ) THEN
        -- Hacer la columna duration nullable y darle un valor por defecto
        ALTER TABLE appointments ALTER COLUMN duration DROP NOT NULL;
        ALTER TABLE appointments ALTER COLUMN duration SET DEFAULT 30;
        
        -- Actualizar registros existentes que tengan duration NULL
        UPDATE appointments SET duration = 30 WHERE duration IS NULL;
        
        RAISE NOTICE 'Columna duration actualizada para ser opcional con valor por defecto de 30 minutos';
    END IF;
    
    -- Si no existe la columna duration, crearla como opcional
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 30;
        RAISE NOTICE 'Columna duration creada con valor por defecto de 30 minutos';
    END IF;
END $$;
