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

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS check_emergency_sentinel_badge CASCADE;
DROP FUNCTION IF EXISTS check_evidence_guardian_badge CASCADE;
DROP FUNCTION IF EXISTS check_community_defender_badge CASCADE;
DROP FUNCTION IF EXISTS check_badges_on_action CASCADE;

-- Create function to check and award emergency sentinel badge
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