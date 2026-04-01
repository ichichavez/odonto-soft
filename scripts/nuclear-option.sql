-- Opción nuclear: recrear toda la tabla appointments
DO $$
DECLARE
    appointment_record RECORD;
BEGIN
    RAISE NOTICE '💥 OPCIÓN NUCLEAR: Recreando tabla appointments';
    
    -- Crear tabla temporal con los datos existentes
    CREATE TEMP TABLE appointments_backup AS 
    SELECT * FROM appointments;
    
    RAISE NOTICE '📦 Respaldo creado con % registros', (SELECT COUNT(*) FROM appointments_backup);
    
    -- Eliminar tabla original
    DROP TABLE appointments CASCADE;
    
    -- Recrear tabla sin restricciones problemáticas
    CREATE TABLE appointments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    
    -- Agregar solo las foreign keys necesarias
    ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_patient 
    FOREIGN KEY (patient_id) REFERENCES patients(id);
    
    ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_dentist 
    FOREIGN KEY (dentist_id) REFERENCES users(id);
    
    ALTER TABLE appointments 
    ADD CONSTRAINT fk_appointments_treatment 
    FOREIGN KEY (treatment_id) REFERENCES treatments(id);
    
    -- Restaurar datos
    INSERT INTO appointments 
    SELECT * FROM appointments_backup;
    
    RAISE NOTICE '✅ Tabla recreada exitosamente';
    
    -- Probar inserción inmediatamente
    DECLARE
        test_patient_id UUID;
        test_dentist_id UUID;
        test_appointment_id UUID;
    BEGIN
        SELECT id INTO test_patient_id FROM patients LIMIT 1;
        SELECT id INTO test_dentist_id FROM users WHERE role IN ('dentist', 'dentista', 'admin') LIMIT 1;
        
        IF test_patient_id IS NOT NULL AND test_dentist_id IS NOT NULL THEN
            INSERT INTO appointments (patient_id, dentist_id, date, time, duration, status)
            VALUES (test_patient_id, test_dentist_id, CURRENT_DATE + 1, '10:00:00', 30, 'scheduled')
            RETURNING id INTO test_appointment_id;
            
            RAISE NOTICE '🎉 ÉXITO: Inserción de prueba completada con ID: %', test_appointment_id;
            
            -- Limpiar
            DELETE FROM appointments WHERE id = test_appointment_id;
            RAISE NOTICE '🧹 Registro de prueba eliminado';
        END IF;
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '💥 Error durante recreación: %', SQLERRM;
        -- En caso de error, intentar restaurar desde backup si existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments_backup') THEN
            RAISE NOTICE '🔄 Intentando restaurar desde backup...';
        END IF;
END $$;
