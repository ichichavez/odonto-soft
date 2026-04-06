-- Agregar columna currency a clinics (moneda por defecto: Guaraní paraguayo)
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'PYG';
