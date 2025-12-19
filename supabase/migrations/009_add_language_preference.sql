-- Add language_preference field to users table for app language selection
-- Run this SQL in your Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'language_preference'
    ) THEN
        ALTER TABLE users ADD COLUMN language_preference text DEFAULT 'en' CHECK (language_preference IN ('en', 'es'));
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_language_preference ON users(language_preference) WHERE language_preference IS NOT NULL;
