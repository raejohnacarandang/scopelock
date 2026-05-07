-- Add trial fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_status VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'none';

-- Index for querying active trials
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_trial ON user_profiles(trial_end_at) WHERE trial_status = 'active';