-- Corregir la restricción NOT NULL en la columna duration
SELECT 'Corrigiendo restricción de duration...' as status;

-- Primero, actualizar todos los registros existentes que tengan duration NULL
UPDATE appointments 
SET duration = 30 
WHERE duration IS NULL;

-- Luego, hacer la columna opcional (permitir NULL) y establecer un valor por defecto
ALTER TABLE appointments 
ALTER COLUMN duration DROP NOT NULL;

ALTER TABLE appointments 
ALTER COLUMN duration SET DEFAULT 30;

-- Verificar el cambio
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'duration'
AND table_schema = 'public';

SELECT 'Restricción de duration corregida' as resultado;
