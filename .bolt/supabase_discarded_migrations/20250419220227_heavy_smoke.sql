-- Drop all existing functions to avoid conflicts
DO $$ 
BEGIN
  -- Drop SMS related functions
  DROP FUNCTION IF EXISTS get_sms_history(uuid, integer, text);
  DROP FUNCTION IF EXISTS get_sms_stats(uuid, integer);
  DROP FUNCTION IF EXISTS mark_sms_delivered(uuid, jsonb);
  DROP FUNCTION IF EXISTS handle_sms_failure(uuid, text, jsonb);
  DROP FUNCTION IF EXISTS get_emergency_alerts_sent(uuid, integer);
  DROP FUNCTION IF EXISTS get_emergency_alerts(uuid, integer);
  
  -- Drop cover story related functions
  DROP FUNCTION IF EXISTS activate_cover_story(uuid, text, text, text, jsonb);
  DROP FUNCTION IF EXISTS deactivate_cover_story(uuid, text, jsonb);
  DROP FUNCTION IF EXISTS get_cover_story_stats(uuid, integer);
  DROP FUNCTION IF EXISTS get_active_cover_story(uuid);
  
  -- Drop cleanup related functions
  DROP FUNCTION IF EXISTS get_cleanup_history(integer, text);
  
  -- Drop badge related functions
  DROP FUNCTION IF EXISTS check_emergency_sentinel_badge(uuid);
  DROP FUNCTION IF EXISTS check_evidence_guardian_badge(uuid);
  DROP FUNCTION IF EXISTS check_community_defender_badge(uuid);
  DROP FUNCTION IF EXISTS check_badges_on_action();
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS check_badges_incidents ON incidents;
DROP TRIGGER IF EXISTS check_badges_recordings ON incident_recordings;
DROP TRIGGER IF EXISTS check_badges_comments ON incident_comments;

-- Recreate SMS related functions
-- Create function to get SMS history
CREATE OR REPLACE FUNCTION get_sms_history(
    user_uuid uuid,
    days_ago integer DEFAULT 30,
    status_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    contact_phone text,
    message text,
    status text,
    sent_at timestamptz,
    delivered_at timestamptz,
    location_lat double precision,
    location_lng double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.contact_name,
        se.contact_phone,
        se.message,
        se.status,
        se.sent_at,
        se.delivered_at,
        ST_Y(se.location::geometry) as lat,
        ST_X(se.location::geometry) as lng
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
        AND se.sent_at > NOW() - (days_ago || ' days')::interval
        AND (status_filter IS NULL OR se.status = status_filter)
    ORDER BY se.sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get SMS statistics
CREATE OR REPLACE FUNCTION get_sms_stats(
    user_uuid uuid,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_sent bigint,
    total_delivered bigint,
    total_failed bigint,
    average_delivery_time interval,
    delivery_success_rate numeric(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as sent,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            AVG(delivered_at - sent_at) FILTER (WHERE delivered_at IS NOT NULL) as avg_time
        FROM sms_events
        WHERE 
            user_id = user_uuid
            AND sent_at > NOW() - (days_ago || ' days')::interval
    )
    SELECT 
        sent::bigint as total_sent,
        delivered::bigint as total_delivered,
        failed::bigint as total_failed,
        avg_time as average_delivery_time,
        CASE 
            WHEN sent > 0 THEN 
                ROUND((delivered::numeric / sent::numeric) * 100, 2)
            ELSE 0
        END as delivery_success_rate
    FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get emergency alerts
CREATE OR REPLACE FUNCTION get_emergency_alerts(
    user_uuid uuid,
    hours_ago integer DEFAULT 24
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    sent_at timestamptz,
    status text,
    location_lat double precision,
    location_lng double precision,
    alert_type text,
    alert_metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.contact_name,
        se.sent_at,
        se.status,
        ST_Y(se.location::geometry) as lat,
        ST_X(se.location::geometry) as lng,
        se.metadata->>'alert_type' as alert_type,
        se.metadata->'alert_details' as alert_metadata
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
        AND se.sent_at > NOW() - (hours_ago || ' hours')::interval
        AND se.metadata->>'type' = 'emergency_alert'
    ORDER BY se.sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Recreate badge related functions
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

-- Add cleanup related functions
CREATE OR REPLACE FUNCTION get_cleanup_history(
    p_days_ago integer DEFAULT 7,
    p_cleanup_type text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    file_path text,
    cleanup_type text,
    status text,
    error_message text,
    metadata jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mce.id,
        mce.file_path,
        mce.cleanup_type,
        mce.status,
        mce.error_message,
        mce.metadata,
        mce.created_at
    FROM media_cleanup_events mce
    WHERE 
        mce.created_at > NOW() - (p_days_ago || ' days')::interval
        AND (p_cleanup_type IS NULL OR mce.cleanup_type = p_cleanup_type)
    ORDER BY mce.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Recreate cover story related functions
CREATE OR REPLACE FUNCTION activate_cover_story(
    user_uuid uuid,
    p_platform text,
    p_screen_type text,
    p_trigger_type text,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    v_event_id uuid;
BEGIN
    -- Check for active cover story
    UPDATE cover_story_events
    SET 
        action = 'deactivated',
        deactivated_at = now(),
        duration_ms = EXTRACT(EPOCH FROM (now() - activated_at)) * 1000
    WHERE 
        user_id = user_uuid
        AND action = 'activated'
        AND deactivated_at IS NULL;

    -- Create new activation event
    INSERT INTO cover_story_events (
        user_id,
        action,
        platform,
        screen_type,
        trigger_type,
        metadata
    ) VALUES (
        user_uuid,
        'activated',
        p_platform,
        p_screen_type,
        p_trigger_type,
        p_metadata
    )
    RETURNING id INTO v_event_id;

    -- Update user settings
    UPDATE user_settings
    SET 
        stealth_mode_enabled = true,
        cover_story_screen = p_screen_type,
        updated_at = now()
    WHERE id = user_uuid;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to deactivate cover story
CREATE OR REPLACE FUNCTION deactivate_cover_story(
    user_uuid uuid,
    p_trigger_type text DEFAULT 'manual',
    p_metadata jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
    v_active_event cover_story_events%ROWTYPE;
BEGIN
    -- Get active cover story
    SELECT * INTO v_active_event
    FROM cover_story_events
    WHERE 
        user_id = user_uuid
        AND action = 'activated'
        AND deactivated_at IS NULL;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Update event
    UPDATE cover_story_events
    SET 
        action = 'deactivated',
        deactivated_at = now(),
        duration_ms = EXTRACT(EPOCH FROM (now() - activated_at)) * 1000,
        metadata = metadata || jsonb_build_object(
            'deactivation_trigger', p_trigger_type,
            'deactivation_metadata', p_metadata
        )
    WHERE id = v_active_event.id;

    -- Update user settings
    UPDATE user_settings
    SET 
        stealth_mode_enabled = false,
        updated_at = now()
    WHERE id = user_uuid;

    RETURN true;
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

-- Verify all functions are created
DO $$ 
BEGIN
  ASSERT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_sms_history'
  ), 'get_sms_history function not found';
  
  ASSERT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'activate_cover_story'
  ), 'activate_cover_story function not found';
  
  ASSERT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_cleanup_history'
  ), 'get_cleanup_history function not found';
  
  ASSERT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'check_badges_on_action'
  ), 'check_badges_on_action function not found';
END $$;