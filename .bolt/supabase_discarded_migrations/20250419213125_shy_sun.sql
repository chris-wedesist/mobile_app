/*
  # Settings Audit Log System

  1. New Table
    - `settings_audit_log`
      - Track all settings changes
      - Store before/after values
      - Record metadata about changes
      - Track platform and source information
    
  2. Features
    - Detailed change tracking
    - Platform-specific logging
    - Diff calculation for changes
    - Comprehensive metadata
    
  3. Security
    - RLS enabled
    - User-specific access control
*/

-- Create settings_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    setting_changed text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    changed_at timestamptz DEFAULT now() NOT NULL,
    platform text NOT NULL,
    ip_address text,
    user_agent text,
    change_source text DEFAULT 'app' NOT NULL,
    session_id text,
    metadata jsonb DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS settings_audit_log_user_id_idx ON public.settings_audit_log (user_id);
CREATE INDEX IF NOT EXISTS settings_audit_log_changed_at_idx ON public.settings_audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS settings_audit_log_setting_idx ON public.settings_audit_log (setting_changed);

-- Enable Row Level Security
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own audit log" ON public.settings_audit_log
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create or replace audit trigger function
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
DECLARE
    setting_name text := TG_ARGV[0];
    old_val jsonb;
    new_val jsonb;
    platform_val text;
    ip_val text;
    ua_val text;
    session_val text;
BEGIN
    -- Extract the specific setting value that changed
    CASE setting_name
        WHEN 'stealth_mode' THEN
            old_val := jsonb_build_object('enabled', OLD.stealth_mode_enabled);
            new_val := jsonb_build_object('enabled', NEW.stealth_mode_enabled);
        WHEN 'cover_story' THEN
            old_val := jsonb_build_object('screen', OLD.cover_story_screen);
            new_val := jsonb_build_object('screen', NEW.cover_story_screen);
        WHEN 'panic_gesture' THEN
            old_val := jsonb_build_object('type', OLD.panic_gesture_type);
            new_val := jsonb_build_object('type', NEW.panic_gesture_type);
        WHEN 'auto_upload' THEN
            old_val := jsonb_build_object('enabled', OLD.auto_upload_enabled);
            new_val := jsonb_build_object('enabled', NEW.auto_upload_enabled);
        WHEN 'auto_wipe' THEN
            old_val := jsonb_build_object('enabled', OLD.auto_wipe_after_upload);
            new_val := jsonb_build_object('enabled', NEW.auto_wipe_after_upload);
        WHEN 'emergency_sms' THEN
            old_val := jsonb_build_object('enabled', OLD.emergency_sms_enabled);
            new_val := jsonb_build_object('enabled', NEW.emergency_sms_enabled);
        ELSE
            old_val := to_jsonb(OLD);
            new_val := to_jsonb(NEW);
    END CASE;

    -- Get request metadata
    BEGIN
        platform_val := current_setting('app.platform', true);
    EXCEPTION WHEN OTHERS THEN
        platform_val := 'unknown';
    END;
    
    BEGIN
        ip_val := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';
    EXCEPTION WHEN OTHERS THEN
        ip_val := NULL;
    END;
    
    BEGIN
        ua_val := current_setting('request.headers', true)::jsonb->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        ua_val := NULL;
    END;
    
    BEGIN
        session_val := current_setting('request.jwt.claims', true)::jsonb->>'session_id';
    EXCEPTION WHEN OTHERS THEN
        session_val := NULL;
    END;

    -- Insert audit log entry
    INSERT INTO public.settings_audit_log (
        user_id,
        setting_changed,
        old_value,
        new_value,
        platform,
        ip_address,
        user_agent,
        session_id,
        metadata
    ) VALUES (
        OLD.user_id,
        setting_name,
        old_val,
        new_val,
        platform_val,
        ip_val,
        ua_val,
        session_val,
        jsonb_build_object(
            'changed_by', current_setting('request.jwt.claims', true)::jsonb->>'sub',
            'app_version', current_setting('app.version', true),
            'diff', jsonb_diff_val(old_val, new_val)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create jsonb_diff_val function to calculate differences
CREATE OR REPLACE FUNCTION jsonb_diff_val(val1 jsonb, val2 jsonb)
RETURNS jsonb AS $$
DECLARE
    result jsonb := '{}'::jsonb;
    key text;
    value1 jsonb;
    value2 jsonb;
BEGIN
    -- Check for nulls
    IF val1 IS NULL AND val2 IS NULL THEN
        RETURN NULL;
    ELSIF val1 IS NULL THEN
        RETURN jsonb_build_object('added', val2);
    ELSIF val2 IS NULL THEN
        RETURN jsonb_build_object('removed', val1);
    END IF;

    -- Find keys that exist in both or either object
    FOR key IN 
        SELECT DISTINCT k FROM (
            SELECT jsonb_object_keys(val1) AS k
            UNION
            SELECT jsonb_object_keys(val2) AS k
        ) keys
    LOOP
        value1 := val1 -> key;
        value2 := val2 -> key;
        
        -- Key exists in both objects
        IF value1 IS NOT NULL AND value2 IS NOT NULL THEN
            -- Values are different
            IF value1 <> value2 THEN
                result := result || jsonb_build_object(
                    key, 
                    jsonb_build_object('from', value1, 'to', value2)
                );
            END IF;
        -- Key only exists in val1
        ELSIF value1 IS NOT NULL THEN
            result := result || jsonb_build_object(
                key, 
                jsonb_build_object('removed', value1)
            );
        -- Key only exists in val2
        ELSIF value2 IS NOT NULL THEN
            result := result || jsonb_build_object(
                key, 
                jsonb_build_object('added', value2)
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DO $$
BEGIN
    DROP TRIGGER IF EXISTS audit_stealth_mode ON public.user_settings;
    DROP TRIGGER IF EXISTS audit_cover_story ON public.user_settings;
    DROP TRIGGER IF EXISTS audit_panic_gesture ON public.user_settings;
    DROP TRIGGER IF EXISTS audit_auto_upload ON public.user_settings;
    DROP TRIGGER IF EXISTS audit_auto_wipe ON public.user_settings;
    DROP TRIGGER IF EXISTS audit_emergency_sms ON public.user_settings;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END$$;

-- Create triggers for settings changes
CREATE TRIGGER audit_stealth_mode
    AFTER UPDATE OF stealth_mode_enabled ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('stealth_mode');

CREATE TRIGGER audit_cover_story
    AFTER UPDATE OF cover_story_screen ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('cover_story');

CREATE TRIGGER audit_panic_gesture
    AFTER UPDATE OF panic_gesture_type ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('panic_gesture');

CREATE TRIGGER audit_auto_upload
    AFTER UPDATE OF auto_upload_enabled ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('auto_upload');

CREATE TRIGGER audit_auto_wipe
    AFTER UPDATE OF auto_wipe_after_upload ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('auto_wipe');

CREATE TRIGGER audit_emergency_sms
    AFTER UPDATE OF emergency_sms_enabled ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change('emergency_sms');

-- Create helper function to get settings audit log
CREATE OR REPLACE FUNCTION get_settings_audit_log(
    user_uuid uuid,
    days_ago integer DEFAULT 30,
    setting_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    setting_changed text,
    old_value jsonb,
    new_value jsonb,
    changed_at timestamptz,
    platform text,
    change_source text,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sal.id,
        sal.setting_changed,
        sal.old_value,
        sal.new_value,
        sal.changed_at,
        sal.platform,
        sal.change_source,
        sal.metadata
    FROM settings_audit_log sal
    WHERE 
        sal.user_id = user_uuid
        AND sal.changed_at > NOW() - (days_ago || ' days')::interval
        AND (setting_filter IS NULL OR sal.setting_changed = setting_filter)
    ORDER BY sal.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get settings change summary
CREATE OR REPLACE FUNCTION get_settings_change_summary(
    user_uuid uuid,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    setting_name text,
    change_count bigint,
    last_changed timestamptz,
    current_value jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH setting_stats AS (
        SELECT 
            sal.setting_changed,
            COUNT(*) as changes,
            MAX(sal.changed_at) as last_change,
            FIRST_VALUE(sal.new_value) OVER (
                PARTITION BY sal.setting_changed 
                ORDER BY sal.changed_at DESC
            ) as latest_value
        FROM settings_audit_log sal
        WHERE 
            sal.user_id = user_uuid
            AND sal.changed_at > NOW() - (days_ago || ' days')::interval
        GROUP BY 
            sal.setting_changed
    )
    SELECT 
        ss.setting_changed,
        ss.changes,
        ss.last_change,
        ss.latest_value
    FROM setting_stats ss
    ORDER BY ss.last_change DESC;
END;
$$ LANGUAGE plpgsql;