/*
  # Cover Story Events System

  1. New Functions
    - activate_cover_story: Handle cover story activation
    - deactivate_cover_story: Handle cover story deactivation
    - get_cover_story_stats: Get usage statistics
    - get_active_cover_story: Get current active cover story
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS activate_cover_story;
DROP FUNCTION IF EXISTS deactivate_cover_story;
DROP FUNCTION IF EXISTS get_cover_story_stats;
DROP FUNCTION IF EXISTS get_active_cover_story;

-- Create function to activate cover story
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

-- Create function to get cover story usage stats
CREATE OR REPLACE FUNCTION get_cover_story_stats(
    user_uuid uuid,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_activations bigint,
    total_duration_ms bigint,
    avg_duration_ms integer,
    most_used_screen text,
    most_common_trigger text,
    platform_breakdown jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE action = 'activated') as activations,
            SUM(duration_ms) as total_duration,
            AVG(duration_ms)::integer as avg_duration,
            MODE() WITHIN GROUP (ORDER BY screen_type) as top_screen,
            MODE() WITHIN GROUP (ORDER BY trigger_type) as top_trigger,
            jsonb_object_agg(
                platform,
                COUNT(*) FILTER (WHERE action = 'activated')
            ) as platforms
        FROM cover_story_events
        WHERE 
            user_id = user_uuid
            AND created_at > NOW() - (days_ago || ' days')::interval
    )
    SELECT 
        activations as total_activations,
        total_duration as total_duration_ms,
        avg_duration as avg_duration_ms,
        top_screen as most_used_screen,
        top_trigger as most_common_trigger,
        platforms as platform_breakdown
    FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Create function to get active cover story
CREATE OR REPLACE FUNCTION get_active_cover_story(user_uuid uuid)
RETURNS TABLE (
    event_id uuid,
    screen_type text,
    activated_at timestamptz,
    duration_ms integer,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cse.id,
        cse.screen_type,
        cse.activated_at,
        EXTRACT(EPOCH FROM (now() - cse.activated_at))::integer * 1000 as duration_ms,
        cse.metadata
    FROM cover_story_events cse
    WHERE 
        cse.user_id = user_uuid
        AND cse.action = 'activated'
        AND cse.deactivated_at IS NULL
    ORDER BY cse.activated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;