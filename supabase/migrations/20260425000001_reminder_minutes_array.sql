-- Replace single notification_before_minutes with a multi-value array
-- so users can receive reminders at multiple intervals (e.g. 24 h AND 30 min).
-- The old column is kept untouched for safety; all new code uses reminder_minutes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER[] NOT NULL DEFAULT '{30}';
