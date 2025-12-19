-- Quick SQL script to add language_preference column
-- Copy and paste this into your Supabase SQL Editor and run it

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'en' 
CHECK (language_preference IN ('en', 'es'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_language_preference 
ON users(language_preference) 
WHERE language_preference IS NOT NULL;

