-- Verificar si la tabla appointments_new existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments_new') THEN
        RAISE NOTICE 'Tabla appointments_new no existe, creándola...';
        
        -- Crear la tabla appointments_new
        CREATE TABLE appointments_new (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID NOT NULL,
            dentist_id UUID NOT NULL,
            treatment_id UUID,
            date DATE NOT NULL,
            time TIME NOT NULL,
            duration INTEGER DEFAULT 30,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Crear índices
        CREATE INDEX idx_appointments_new_patient_id ON appointments_new(patient_id);
        CREATE INDEX idx_appointments_new_dentist_id ON appointments_new(dentist_id);
        CREATE INDEX idx_appointments_new_date ON appointments_new(date);

        -- Crear función para updated_at
        CREATE OR REPLACE FUNCTION update_appointments_new_updated_at()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ language 'plpgsql';

        -- Crear trigger
        CREATE TRIGGER update_appointments_new_updated_at
            BEFORE UPDATE ON appointments_new
            FOR EACH ROW
            EXECUTE FUNCTION update_appointments_new_updated_at();

        -- Agregar foreign keys
        ALTER TABLE appointments_new 
        ADD CONSTRAINT fk_appointments_new_patient 
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

        ALTER TABLE appointments_new 
        ADD CONSTRAINT fk_appointments_new_dentist 
        FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE;

        ALTER TABLE appointments_new 
        ADD CONSTRAINT fk_appointments_new_treatment 
        FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL;

        RAISE NOTICE 'Tabla appointments_new creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla appointments_new ya existe';
    END IF;
END $$;

-- Crear función RPC si no existe
CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id UUID,
    p_dentist_id UUID,
    p_treatment_id UUID,
    p_date DATE,
    p_time TIME,
    p_duration INTEGER DEFAULT 30,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_id UUID;
    result JSON;
    target_table TEXT;
BEGIN
    -- Determinar qué tabla usar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments_new') THEN
        target_table := 'appointments_new';
    ELSE
        target_table := 'appointments';
    END IF;
    
    -- Insertar en la tabla apropiada
    IF target_table = 'appointments_new' THEN
        INSERT INTO appointments_new (
            patient_id, dentist_id, treatment_id, date, time, duration, status, notes
        ) VALUES (
            p_patient_id, p_dentist_id, p_treatment_id, p_date, p_time, p_duration, 'scheduled', p_notes
        ) RETURNING id INTO new_id;
        
        SELECT row_to_json(a) INTO result
        FROM appointments_new a
        WHERE a.id = new_id;
    ELSE
        INSERT INTO appointments (
            patient_id, dentist_id, treatment_id, date, time, duration, status, notes
        ) VALUES (
            p_patient_id, p_dentist_id, p_treatment_id, p_date, p_time, p_duration, 'scheduled', p_notes
        ) RETURNING id INTO new_id;
        
        SELECT row_to_json(a) INTO result
        FROM appointments a
        WHERE a.id = new_id;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'detail', SQLSTATE,
            'table_used', target_table
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar estructura final
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments_new') 
        THEN 'appointments_new existe ✅'
        ELSE 'appointments_new NO existe ❌'
    END as tabla_nueva,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') 
        THEN 'appointments existe ✅'
        ELSE 'appointments NO existe ❌'
    END as tabla_original;
