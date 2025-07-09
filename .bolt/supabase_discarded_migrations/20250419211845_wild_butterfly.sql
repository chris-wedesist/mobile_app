-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS activate_cover_story CASCADE;
DROP FUNCTION IF EXISTS deactivate_cover_story CASCADE;
DROP FUNCTION IF EXISTS get_cover_story_stats CASCADE;
DROP FUNCTION IF EXISTS get_active_cover_story CASCADE;

-- Create cover_story_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS cover_story_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    platform text NOT NULL,
    screen_type text NOT NULL,
    activated_at timestamptz DEFAULT now() NOT NULL,
    deactivated_at timestamptz,
    duration_ms integer,
    trigger_type text NOT NULL,
    metadata jsonb DEFAULT '{}'
);

-- Add constraints
ALTER TABLE cover_story_events 
ADD CONSTRAINT valid_action CHECK (
    action = ANY (ARRAY[
        'activated',
        'deactivated',
        'auto_activated',
        'force_deactivated'
    ])
);

ALTER TABLE cover_story_events 
ADD CONSTRAINT valid_platform CHECK (
    platform = ANY (ARRAY[
        'web',
        'ios',
        'android'
    ])
);

ALTER TABLE cover_story_events 
ADD CONSTRAINT valid_screen_type CHECK (
    screen_type = ANY (ARRAY[
        'notes',
        'calculator',
        'calendar',
        'browser'
    ])
);

ALTER TABLE cover_story_events 
ADD CONSTRAINT valid_trigger_type CHECK (
    trigger_type = ANY (ARRAY[
        'manual',
        'auto_background',
        'gesture',
        'volume_buttons',
        'shake',
        'system'
    ])
);

-- Create or replace helper functions
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