/*
  # Badge System Implementation

  1. New Tables
    - Add badge fields to user_settings
    - Add badge events tracking
    - Add badge requirements table
    
  2. Security
    - Enable RLS on new tables
    - Add policies for badge management
*/

-- Add badge-related fields to user_settings table if they don't exist
DO $$ 
BEGIN
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

-- Create badge events table if it doesn't exist
CREATE TABLE IF NOT EXISTS badge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create badge requirements table if it doesn't exist
CREATE TABLE IF NOT EXISTS badge_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on badge_events and badge_requirements
ALTER TABLE badge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own badge events" ON badge_events;
    DROP POLICY IF EXISTS "System can insert badge events" ON badge_events;
    DROP POLICY IF EXISTS "Anyone can view badge requirements" ON badge_requirements;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create RLS policies
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

CREATE POLICY "Anyone can view badge requirements"
  ON badge_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial badge requirements if they don't exist
INSERT INTO badge_requirements (badge_name, requirement_type, requirement_value, description)
SELECT * FROM (VALUES
  ('founding_protector', 'onboarding', 1, 'Complete safety mission demo'),
  ('shield_builder', 'invites', 3, 'Successfully invite 3 others to join'),
  ('emergency_sentinel', 'verified_incidents', 5, 'Report 5 verified incidents'),
  ('evidence_guardian', 'public_recordings', 10, 'Share 10 public recordings'),
  ('community_defender', 'comments', 25, 'Make 25 helpful comments')
) AS v(badge_name, requirement_type, requirement_value, description)
WHERE NOT EXISTS (
  SELECT 1 FROM badge_requirements
);

-- Create helper functions for badge management
CREATE OR REPLACE FUNCTION check_emergency_sentinel_badge(user_id uuid)
RETURNS void AS $$
DECLARE
  incident_count integer;
BEGIN
  SELECT COUNT(*) INTO incident_count
  FROM incidents
  WHERE incidents.user_id = user_id
  AND status = 'verified';

  IF incident_count >= 5 THEN
    UPDATE user_settings
    SET badge_emergency_sentinel = true
    WHERE id = user_id
    AND NOT badge_emergency_sentinel;

    IF FOUND THEN
      INSERT INTO badge_events (user_id, badge_name, metadata)
      VALUES (user_id, 'emergency_sentinel', jsonb_build_object(
        'incident_count', incident_count,
        'awarded_for', 'verified_incidents'
      ));
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and award evidence guardian badge
CREATE OR REPLACE FUNCTION check_evidence_guardian_badge(user_id uuid)
RETURNS void AS $$
DECLARE
  evidence_count integer;
BEGIN
  SELECT COUNT(*) INTO evidence_count
  FROM incident_recordings
  WHERE incident_recordings.user_id = user_id
  AND status = 'public';

  IF evidence_count >= 10 THEN
    UPDATE user_settings
    SET badge_evidence_guardian = true
    WHERE id = user_id
    AND NOT badge_evidence_guardian;

    IF FOUND THEN
      INSERT INTO badge_events (user_id, badge_name, metadata)
      VALUES (user_id, 'evidence_guardian', jsonb_build_object(
        'evidence_count', evidence_count,
        'awarded_for', 'public_recordings'
      ));
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and award community defender badge
CREATE OR REPLACE FUNCTION check_community_defender_badge(user_id uuid)
RETURNS void AS $$
DECLARE
  comment_count integer;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM incident_comments
  WHERE incident_comments.user_id = user_id;

  IF comment_count >= 25 THEN
    UPDATE user_settings
    SET badge_community_defender = true
    WHERE id = user_id
    AND NOT badge_community_defender;

    IF FOUND THEN
      INSERT INTO badge_events (user_id, badge_name, metadata)
      VALUES (user_id, 'community_defender', jsonb_build_object(
        'comment_count', comment_count,
        'awarded_for', 'community_engagement'
      ));
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check badges on relevant actions
CREATE OR REPLACE FUNCTION check_badges_on_action()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_emergency_sentinel_badge(NEW.user_id);
  PERFORM check_evidence_guardian_badge(NEW.user_id);
  PERFORM check_community_defender_badge(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS check_badges_incidents ON incidents;
DROP TRIGGER IF EXISTS check_badges_recordings ON incident_recordings;
DROP TRIGGER IF EXISTS check_badges_comments ON incident_comments;

-- Add triggers for badge checks
CREATE TRIGGER check_badges_incidents
  AFTER INSERT OR UPDATE OF status
  ON incidents
  FOR EACH ROW
  WHEN (NEW.status = 'verified')
  EXECUTE FUNCTION check_badges_on_action();

CREATE TRIGGER check_badges_recordings
  AFTER INSERT OR UPDATE OF status
  ON incident_recordings
  FOR EACH ROW
  WHEN (NEW.status = 'public')
  EXECUTE FUNCTION check_badges_on_action();

CREATE TRIGGER check_badges_comments
  AFTER INSERT
  ON incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_badges_on_action();