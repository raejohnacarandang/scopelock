-- Add lifetime subscription flag for founding users
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT false;

-- Index for querying lifetime users
CREATE INDEX IF NOT EXISTS idx_user_profiles_lifetime ON user_profiles(is_lifetime) WHERE is_lifetime = true;