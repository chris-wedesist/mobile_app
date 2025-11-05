-- Add emergency settings fields to users table
-- This migration is safe to run multiple times

-- Add emergency_contact_name field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_contact_name'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_contact_name text;
    END IF;
END $$;

-- Add emergency_contact_phone field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_contact_phone'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_contact_phone text;
    END IF;
END $$;

-- Add emergency_call_code field if it doesn't exist (SMS code for calculator)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_call_code'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_call_code text;
    END IF;
END $$;

-- Add emergency_message field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_message'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_message text;
    END IF;
END $$;

-- Add emergency_sms_enabled field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emergency_sms_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN emergency_sms_enabled boolean DEFAULT true;
    END IF;
END $$;

-- Create indexes for emergency settings if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_emergency_contact_phone ON users(emergency_contact_phone) WHERE emergency_contact_phone IS NOT NULL;

-- Ensure RLS policies allow users to update their own emergency settings
-- The existing policies should already cover this, but we'll verify
DO $$
BEGIN
    -- Check if the update policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can update their own data'
    ) THEN
        CREATE POLICY "Users can update their own data" ON users
          FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Add comments to document the fields
COMMENT ON COLUMN users.emergency_contact_name IS 'Name of the emergency contact';
COMMENT ON COLUMN users.emergency_contact_phone IS 'Phone number for emergency SMS notifications';
COMMENT ON COLUMN users.emergency_call_code IS 'Code to enter in calculator (stealth mode) to send emergency SMS';
COMMENT ON COLUMN users.emergency_message IS 'Custom emergency message to send in SMS';
COMMENT ON COLUMN users.emergency_sms_enabled IS 'Whether emergency SMS notifications are enabled';

