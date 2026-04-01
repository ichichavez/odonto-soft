-- Verificar si la columna duration existe y duration_minutes no existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'treatments' AND column_name = 'duration'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'treatments' AND column_name = 'duration_minutes'
    ) THEN
        -- Renombrar la columna duration a duration_minutes
        ALTER TABLE treatments RENAME COLUMN duration TO duration_minutes;
        RAISE NOTICE 'Columna duration renombrada a duration_minutes';
    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'treatments' AND column_name = 'duration_minutes'
    ) THEN
        -- Si no existe duration_minutes ni duration, crear duration_minutes
        ALTER TABLE treatments ADD COLUMN duration_minutes INTEGER DEFAULT 30;
        RAISE NOTICE 'Columna duration_minutes creada';
    ELSE
        RAISE NOTICE 'La columna duration_minutes ya existe, no se requieren cambios';
    END IF;
END $$;
