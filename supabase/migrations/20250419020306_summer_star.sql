/*
  # Add Shield Builder Badge Fields

  1. New Fields
    - `successful_invite_count` (integer) - Tracks number of successful invites
    - `badge_shield_builder` (boolean) - Indicates if user has earned the Shield Builder badge

  2. Changes
    - Add fields to user_settings table
    - Set default values for new fields
    - Add constraint to ensure invite count is non-negative

  3. Security
    - Maintain existing RLS policies
*/

-- Add new fields to user_settings table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'successful_invite_count'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN successful_invite_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'badge_shield_builder'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN badge_shield_builder boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add constraint to ensure invite count is non-negative
ALTER TABLE user_settings
ADD CONSTRAINT check_invite_count_positive 
CHECK (successful_invite_count >= 0);

-- Create function to update badge status
CREATE OR REPLACE FUNCTION update_shield_builder_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.successful_invite_count >= 3 AND NOT NEW.badge_shield_builder THEN
    NEW.badge_shield_builder := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update badge status
DROP TRIGGER IF EXISTS check_shield_builder_badge ON user_settings;
CREATE TRIGGER check_shield_builder_badge
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_shield_builder_badge();

-- Create function to increment invite count
CREATE OR REPLACE FUNCTION increment_successful_invite_count(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_settings
  SET successful_invite_count = successful_invite_count + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;