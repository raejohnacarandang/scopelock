-- Add subscription expiry tracking for monthly subscriptions
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Index for faster queries on expiry
CREATE INDEX IF NOT EXISTS idx_user_profiles_expiry ON user_profiles(subscription_expires_at) WHERE subscription_status = 'active';