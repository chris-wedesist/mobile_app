-- Add incident_report_code field to users table for custom incident reporting code
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'incident_report_code'
    ) THEN
        ALTER TABLE users ADD COLUMN incident_report_code text DEFAULT '999';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_incident_report_code ON users(incident_report_code) WHERE incident_report_code IS NOT NULL;


