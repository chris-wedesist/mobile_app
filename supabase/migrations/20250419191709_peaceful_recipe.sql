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
    user_agent text
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'settings_audit_log' 
        AND indexname = 'settings_audit_log_user_id_idx'
    ) THEN
        CREATE INDEX settings_audit_log_user_id_idx ON public.settings_audit_log (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'settings_audit_log' 
        AND indexname = 'settings_audit_log_changed_at_idx'
    ) THEN
        CREATE INDEX settings_audit_log_changed_at_idx ON public.settings_audit_log (changed_at DESC);
    END IF;
END$$;

-- Enable Row Level Security on settings_audit_log
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for settings_audit_log
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own audit log" ON public.settings_audit_log;
    CREATE POLICY "Users can view own audit log" ON public.settings_audit_log
        FOR SELECT
        USING (auth.uid() = user_id);
END$$;

-- Create or replace audit trigger function
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.settings_audit_log (
        user_id,
        setting_changed,
        old_value,
        new_value,
        platform,
        ip_address,
        user_agent
    ) VALUES (
        OLD.user_id,
        TG_ARGV[0],
        jsonb_build_object('value', OLD),
        jsonb_build_object('value', NEW),
        current_setting('app.platform', true),
        current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        current_setting('request.headers', true)::jsonb->>'user-agent'
    );
    RETURN NEW;
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

-- Create helper function to get user settings
CREATE OR REPLACE FUNCTION get_user_settings(user_uuid uuid)
RETURNS TABLE (
    stealth_mode_enabled boolean,
    cover_story_screen text,
    panic_gesture_type text,
    auto_upload_enabled boolean,
    auto_wipe_after_upload boolean,
    emergency_sms_enabled boolean,
    last_updated timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.stealth_mode_enabled,
        us.cover_story_screen,
        us.panic_gesture_type,
        us.auto_upload_enabled,
        us.auto_wipe_after_upload,
        us.emergency_sms_enabled,
        us.updated_at
    FROM user_settings us
    WHERE us.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;