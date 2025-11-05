-- Add biometric login setting for app authentication
-- This migration is safe to run multiple times

-- Add biometric_login_enabled field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'biometric_login_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN biometric_login_enabled boolean DEFAULT false;
    END IF;
END $$;

-- Add comment to document the field
COMMENT ON COLUMN users.biometric_login_enabled IS 'Require biometric authentication to unlock the app';

