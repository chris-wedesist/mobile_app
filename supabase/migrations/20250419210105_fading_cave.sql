-- Drop existing constraint if it exists
DO $$ 
BEGIN
  ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_invite_count_positive;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Add constraint back if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'user_settings' 
    AND constraint_name = 'check_invite_count_positive'
  ) THEN
    ALTER TABLE user_settings
    ADD CONSTRAINT check_invite_count_positive 
    CHECK (successful_invite_count >= 0);
  END IF;
END $$;

-- Verify constraint exists
DO $$ 
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'user_settings' 
    AND constraint_name = 'check_invite_count_positive'
  ), 'Constraint check_invite_count_positive not found';
END $$;