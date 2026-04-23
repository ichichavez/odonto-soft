-- Add billing_type to subscriptions to distinguish automatic (dLocal/Stripe) vs manual (bank transfer)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'automatic';

-- 'automatic' = managed by dLocal/Stripe
-- 'manual'    = created and managed by superadmin (bank transfer)

COMMENT ON COLUMN subscriptions.billing_type IS 'automatic = dLocal/Stripe; manual = bank transfer managed by superadmin';
