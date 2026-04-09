-- Preferencia de aviso de cita por usuario
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_before_minutes INTEGER NOT NULL DEFAULT 30;
