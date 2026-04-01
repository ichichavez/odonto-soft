-- Agregar las foreign keys que faltan en appointments_new
ALTER TABLE appointments_new 
DROP CONSTRAINT IF EXISTS appointments_new_patient_id_fkey,
DROP CONSTRAINT IF EXISTS appointments_new_dentist_id_fkey,
DROP CONSTRAINT IF EXISTS appointments_new_treatment_id_fkey;

-- Agregar foreign key para patients
ALTER TABLE appointments_new 
ADD CONSTRAINT appointments_new_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Agregar foreign key para users (dentists)
ALTER TABLE appointments_new 
ADD CONSTRAINT appointments_new_dentist_id_fkey 
FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE;

-- Agregar foreign key para treatments (opcional)
ALTER TABLE appointments_new 
ADD CONSTRAINT appointments_new_treatment_id_fkey 
FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE SET NULL;

-- Verificar que las foreign keys se crearon correctamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='appointments_new';

-- Refrescar el cache de esquema de Supabase
NOTIFY pgrst, 'reload schema';

-- Probar una consulta con relaciones
SELECT 
    a.id,
    a.date,
    a.time,
    p.first_name,
    p.last_name,
    u.name as dentist_name
FROM appointments_new a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN users u ON a.dentist_id = u.id
LIMIT 5;
