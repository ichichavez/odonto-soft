-- ============================================================
-- ODONTO-SOFT: Datos de demo
-- Ejecutar DESPUÉS de 01-core-tables.sql y create-dental-records-module.sql
--
-- IMPORTANTE: Antes de ejecutar este script,
-- crear el usuario demo desde Supabase Auth:
--   Authentication → Users → Add user
--   Email: demo@odonto-soft.com
--   Password: Demo1234!
-- Luego copiar el UUID generado y reemplazar DEMO_USER_UUID abajo
-- ============================================================

-- Clínica demo
INSERT INTO clinics (id, name, slug, primary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'OdontoSoft Demo',
  'demo',
  '#10b981'
)
ON CONFLICT (id) DO NOTHING;

-- Asignar rol admin al usuario demo
-- REEMPLAZAR 'DEMO_USER_UUID' con el UUID real del usuario creado en Auth
UPDATE public.users
SET
  name      = 'Admin Demo',
  role      = 'admin',
  clinic_id = '00000000-0000-0000-0000-000000000001'
WHERE id = 'DEMO_USER_UUID';

-- Pacientes de ejemplo
INSERT INTO patients (first_name, last_name, identity_number, phone, birth_date, gender, clinic_id)
VALUES
  ('María', 'González', '4.123.456', '0981 111 222', '1990-05-15', 'F', '00000000-0000-0000-0000-000000000001'),
  ('Carlos', 'Benítez', '3.987.654', '0991 333 444', '1985-08-22', 'M', '00000000-0000-0000-0000-000000000001'),
  ('Sofía', 'Rodríguez', '5.456.789', '0972 555 666', '2015-03-10', 'F', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIN
-- ============================================================
