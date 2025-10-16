-- Add email_confirmed field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false;

-- Add confirmation_code field for code-based confirmation
ALTER TABLE users ADD COLUMN IF NOT EXISTS confirmation_code text;

-- Add confirmation_code_expires_at field
ALTER TABLE users ADD COLUMN IF NOT EXISTS confirmation_code_expires_at timestamptz;

-- Create index for faster confirmation code lookups
CREATE INDEX IF NOT EXISTS idx_users_confirmation_code ON users(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed ON users(email_confirmed);
