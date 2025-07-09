-- Add concurrency protection to badge events
ALTER TABLE badge_events ADD COLUMN version integer NOT NULL DEFAULT 1;

-- Update badge event trigger to handle concurrency
CREATE OR REPLACE FUNCTION update_badge_status()
RETURNS TRIGGER AS $$
DECLARE
  current_version integer;
BEGIN
  -- Get current version to handle concurrency
  SELECT version INTO current_version
  FROM badge_events
  WHERE user_id = NEW.id
  ORDER BY version DESC
  LIMIT 1;

  -- Shield Builder Badge (3 successful invites)
  IF NEW.successful_invite_count >= 3 AND NOT NEW.badge_shield_builder THEN
    NEW.badge_shield_builder := true;
    
    -- Insert badge event with version control
    INSERT INTO badge_events (
      user_id,
      badge_name,
      version,
      metadata
    ) VALUES (
      NEW.id,
      'shield_builder',
      COALESCE(current_version, 0) + 1,
      jsonb_build_object(
        'trigger_type', 'invite_count',
        'count', NEW.successful_invite_count
      )
    );
  END IF;

  -- ... rest of the badge checks with similar version control

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_badge_events_user_version 
ON badge_events(user_id, version DESC);