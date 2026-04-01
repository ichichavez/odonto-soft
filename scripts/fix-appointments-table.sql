-- Verificar si la columna 'duration' existe y eliminarla si es necesario
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'appointments' AND column_name = 'duration') THEN
    ALTER TABLE appointments DROP COLUMN duration;
  END IF;
END $$;

-- Verificar si la columna 'status' tiene el tipo correcto
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'appointments' AND column_name = 'status' 
             AND data_type = 'character varying') THEN
    -- Crear un tipo enum si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
      CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
    END IF;
    
    -- Convertir la columna al tipo enum
    ALTER TABLE appointments 
    ALTER COLUMN status TYPE appointment_status 
    USING status::appointment_status;
  END IF;
END $$;

-- Asegurarse de que todas las columnas necesarias existen
DO $$
BEGIN
  -- Verificar y añadir columna date si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'date') THEN
    ALTER TABLE appointments ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  
  -- Verificar y añadir columna time si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'time') THEN
    ALTER TABLE appointments ADD COLUMN time TIME NOT NULL DEFAULT CURRENT_TIME;
  END IF;
  
  -- Verificar y añadir columna notes si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'notes') THEN
    ALTER TABLE appointments ADD COLUMN notes TEXT;
  END IF;
  
  -- Verificar y añadir columna created_at si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'created_at') THEN
    ALTER TABLE appointments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
  
  -- Verificar y añadir columna updated_at si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'appointments' AND column_name = 'updated_at') THEN
    ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;

-- Crear el trigger
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Actualizar los registros existentes para asegurar consistencia
UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
