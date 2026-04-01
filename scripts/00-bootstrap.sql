-- ============================================================
-- ODONTO-SOFT: Bootstrap — ejecutar PRIMERO
-- Crea la tabla users vinculada a Supabase Auth
-- ============================================================

-- Tabla de usuarios del sistema (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'asistente'
              CHECK (role IN ('admin', 'dentista', 'asistente')),
  clinic_id   UUID,  -- se actualizará después de crear clinics
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear registro en public.users automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'asistente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIN
-- ============================================================
