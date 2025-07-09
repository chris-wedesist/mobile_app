-- Add badge-related fields to user_settings table
DO $$ 
BEGIN
  -- Add successful_invite_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'successful_invite_count'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN successful_invite_count integer NOT NULL DEFAULT 0;
  END IF;

  -- Add badge fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' 
    AND column_name = 'badge_founding_protector'
  ) THEN
    ALTER TABLE user_settings 
    ADD COLUMN badge_founding_protector boolean NOT NULL DEFAULT false,
    ADD COLUMN badge_shield_builder boolean NOT NULL DEFAULT false,
    ADD COLUMN badge_emergency_sentinel boolean NOT NULL DEFAULT false,
    ADD COLUMN badge_evidence_guardian boolean NOT NULL DEFAULT false,
    ADD COLUMN badge_community_defender boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create function to automatically update badge status based on criteria
CREATE OR REPLACE FUNCTION update_badge_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Shield Builder Badge (3 successful invites)
  IF NEW.successful_invite_count >= 3 AND NOT NEW.badge_shield_builder THEN
    NEW.badge_shield_builder := true;
  END IF;

  -- Emergency Sentinel Badge (5 verified incidents)
  IF EXISTS (
    SELECT 1 FROM incidents 
    WHERE user_id = NEW.id 
    AND status = 'verified'
    GROUP BY user_id 
    HAVING COUNT(*) >= 5
  ) AND NOT NEW.badge_emergency_sentinel THEN
    NEW.badge_emergency_sentinel := true;
  END IF;

  -- Evidence Guardian Badge (10 recordings uploaded)
  IF EXISTS (
    SELECT 1 FROM incident_recordings 
    WHERE user_id = NEW.id 
    AND status = 'public'
    GROUP BY user_id 
    HAVING COUNT(*) >= 10
  ) AND NOT NEW.badge_evidence_guardian THEN
    NEW.badge_evidence_guardian := true;
  END IF;

  -- Community Defender Badge (combination of activities)
  IF (
    NEW.badge_shield_builder AND 
    NEW.badge_emergency_sentinel AND 
    NEW.successful_invite_count >= 5
  ) AND NOT NEW.badge_community_defender THEN
    NEW.badge_community_defender := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update badges
DROP TRIGGER IF EXISTS check_badge_status ON user_settings;
CREATE TRIGGER check_badge_status
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_badge_status();

-- Create badge events table to track badge awards
CREATE TABLE IF NOT EXISTS badge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on badge_events
ALTER TABLE badge_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own badge events" ON badge_events;
DROP POLICY IF EXISTS "System can insert badge events" ON badge_events;

-- Create RLS policies for badge_events
CREATE POLICY "Users can view their own badge events"
  ON badge_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert badge events"
  ON badge_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to increment successful invites
CREATE OR REPLACE FUNCTION increment_successful_invite()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_settings
  SET successful_invite_count = successful_invite_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;