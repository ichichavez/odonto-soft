-- Actualizar valores del enum de planes a los nombres en español
-- La columna subscriptions.plan ya existe como TEXT, solo documentamos los valores válidos:
-- 'basico' | 'pro' | 'empresarial'
--
-- Si ya existe la tabla subscriptions con datos en 'free'/'pro'/'enterprise',
-- ejecutar este UPDATE para migrar los valores:

UPDATE subscriptions SET plan = 'basico' WHERE plan = 'free';
UPDATE subscriptions SET plan = 'empresarial' WHERE plan = 'enterprise';

-- Asegurar que la tabla subscriptions tenga la columna trial_ends_at como alias
-- (ya existe como current_period_end, no se necesita columna nueva)

-- Agregar columna currency a clinics si no existe
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
