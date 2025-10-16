-- Ensure users table has required fields for email confirmation
-- This migration is safe to run multiple times

-- Add email_confirmed field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_confirmed'
    ) THEN
        ALTER TABLE users ADD COLUMN email_confirmed boolean DEFAULT false;
    END IF;
END $$;

-- Add confirmation_code field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'confirmation_code'
    ) THEN
        ALTER TABLE users ADD COLUMN confirmation_code text;
    END IF;
END $$;

-- Add confirmation_code_expires_at field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'confirmation_code_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN confirmation_code_expires_at timestamptz;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_confirmation_code ON users(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed ON users(email_confirmed);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all users
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');
