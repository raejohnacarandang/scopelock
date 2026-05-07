-- Add is_lifetime column to track lifetime subscribers
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;