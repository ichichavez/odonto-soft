-- ============================================================
-- ODONTO-SOFT: Multi-tenant clinics table
-- Run this script once in your Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add clinic_id to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

-- Insert demo clinic
INSERT INTO clinics (id, name, slug, primary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'OdontoSoft Demo',
  'demo',
  '#10b981'
)
ON CONFLICT (id) DO NOTHING;

-- Assign demo user to demo clinic
-- Update the UUID below if your demo user has a different id
UPDATE users
SET clinic_id = '00000000-0000-0000-0000-000000000001'
WHERE id = '061e844e-1916-45d3-8dbf-da39a3c8085b';

-- ============================================================
-- Supabase Storage: create bucket for clinic assets
-- (Run in Supabase dashboard Storage section or via API)
-- Bucket name: clinic-assets
-- Public: true
-- Allowed MIME types: image/*
-- ============================================================
