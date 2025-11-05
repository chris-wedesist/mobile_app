-- Add panic_mode_enabled and panic_gesture_type fields to the users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'panic_mode_enabled') THEN
        ALTER TABLE users ADD COLUMN panic_mode_enabled boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'panic_gesture_type') THEN
        ALTER TABLE users ADD COLUMN panic_gesture_type text DEFAULT 'triple_power';
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_panic_mode_enabled ON users (panic_mode_enabled);

-- Update RLS policies to allow users to update their own panic mode settings
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Ensure the select policy allows users to view their own panic mode settings
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);


