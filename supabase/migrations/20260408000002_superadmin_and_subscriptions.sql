-- Superadmin role support + subscriptions table
-- Migration: 20260408000002

-- Add status column to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
-- values: 'active' | 'suspended' | 'trial'

-- Subscriptions table (one per clinic)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id              UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id        TEXT,
  plan                   TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro' | 'enterprise'
  status                 TEXT NOT NULL DEFAULT 'trialing',  -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended'
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id)
);

-- RLS for subscriptions: only service_role can write; admins of the clinic can read their own
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_subscriptions" ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clinic_members_read_own_subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM users WHERE id = auth.uid()
    )
  );

-- Ensure superadmin role value is accepted (users.role is TEXT, no enum)
-- No additional migration needed; role='superadmin' is stored as text.
