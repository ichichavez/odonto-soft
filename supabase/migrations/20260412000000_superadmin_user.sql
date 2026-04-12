-- Superadmin bootstrap: isidrochavez429@gmail.com
-- Migration: 20260412000000
--
-- Crea el usuario superadmin en auth.users (si no existe)
-- y configura su perfil en public.users.
--
-- Contraseña inicial: Admin1234!
-- ⚠️ Cambiarla en el dashboard de Supabase o via "recuperar contraseña" al iniciar sesión.

DO $$
DECLARE
  v_id UUID;
BEGIN
  -- 1. Buscar si ya existe en auth.users
  SELECT id INTO v_id
  FROM auth.users
  WHERE email = 'isidrochavez429@gmail.com';

  -- 2. Si no existe, crear el usuario en auth.users
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'isidrochavez429@gmail.com',
      crypt('Admin1234!', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Isidro Chavez"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 3. Crear o actualizar perfil en public.users
  --    clinic_id = NULL indica que es superadmin global (sin clínica asignada)
  INSERT INTO public.users (id, name, role, clinic_id)
  VALUES (v_id, 'Isidro Chavez', 'superadmin', NULL)
  ON CONFLICT (id) DO UPDATE
    SET role     = 'superadmin',
        clinic_id = NULL,
        name      = 'Isidro Chavez';

END $$;
