-- Migración: agregar columnas de dLocalGo a la tabla subscriptions
-- 20260413000000

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS dlocal_plan_id    TEXT,
  ADD COLUMN IF NOT EXISTS dlocal_plan_token TEXT,
  ADD COLUMN IF NOT EXISTS dlocal_order_id   TEXT;
