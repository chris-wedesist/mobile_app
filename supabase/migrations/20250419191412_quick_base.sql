/*
  # Onboarding Demo System

  1. New Tables
    - `onboarding_progress`: Track user progress through demo
      - Basic info (id, user_id, step)
      - Status tracking
      - Completion timestamps
      - Demo metrics
    
  2. Features
    - Progress tracking
    - Demo completion validation
    - Badge award triggers
    - Analytics tracking
    
  3. Security
    - RLS enabled
    - User-specific access control
*/

-- Create onboarding_progress table
CREATE TABLE public.onboarding_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    current_step text NOT NULL,
    completed_steps text[] DEFAULT '{}' NOT NULL,
    started_at timestamptz DEFAULT now() NOT NULL,
    completed_at timestamptz,
    metrics jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_current_step CHECK (
        current_step = ANY (ARRAY[
            'welcome',
            'panic_button',
            'emergency_contacts',
            'stealth_mode',
            'completed'
        ])
    )
);

-- Create onboarding_events table for analytics
CREATE TABLE public.onboarding_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    event_type text NOT NULL,
    step text NOT NULL,
    duration_ms integer,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_event_type CHECK (
        event_type = ANY (ARRAY[
            'step_started',
            'step_completed',
            'demo_triggered',
            'demo_completed',
            'badge_awarded'
        ])
    )
);

-- Create indexes
CREATE INDEX onboarding_progress_user_idx ON public.onboarding_progress (user_id);
CREATE INDEX onboarding_progress_step_idx ON public.onboarding_progress (current_step);
CREATE INDEX onboarding_events_user_idx ON public.onboarding_events (user_id);
CREATE INDEX onboarding_events_type_idx ON public.onboarding_events (event_type);
CREATE INDEX onboarding_events_created_at_idx ON public.onboarding_events (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own progress" ON public.onboarding_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.onboarding_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON public.onboarding_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert events" ON public.onboarding_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_onboarding_progress_updated_at
    BEFORE UPDATE ON public.onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to start onboarding
CREATE OR REPLACE FUNCTION start_onboarding(user_uuid uuid)
RETURNS uuid AS $$
DECLARE
    v_progress_id uuid;
BEGIN
    -- Create progress record
    INSERT INTO onboarding_progress (
        user_id,
        current_step
    ) VALUES (
        user_uuid,
        'welcome'
    )
    RETURNING id INTO v_progress_id;

    -- Log start event
    INSERT INTO onboarding_events (
        user_id,
        event_type,
        step,
        metadata
    ) VALUES (
        user_uuid,
        'step_started',
        'welcome',
        jsonb_build_object(
            'progress_id', v_progress_id
        )
    );

    RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to complete onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
    user_uuid uuid,
    step_name text,
    step_metrics jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
    v_current_step text;
    v_completed_steps text[];
BEGIN
    -- Get current progress
    SELECT 
        current_step,
        completed_steps
    INTO 
        v_current_step,
        v_completed_steps
    FROM onboarding_progress
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;

    -- Validate step completion
    IF v_current_step != step_name THEN
        RETURN false;
    END IF;

    -- Update progress
    UPDATE onboarding_progress
    SET 
        completed_steps = array_append(completed_steps, step_name),
        current_step = CASE 
            WHEN step_name = 'stealth_mode' THEN 'completed'
            WHEN step_name = 'welcome' THEN 'panic_button'
            WHEN step_name = 'panic_button' THEN 'emergency_contacts'
            WHEN step_name = 'emergency_contacts' THEN 'stealth_mode'
            ELSE current_step
        END,
        completed_at = CASE 
            WHEN step_name = 'stealth_mode' THEN now()
            ELSE completed_at
        END,
        metrics = metrics || step_metrics
    WHERE user_id = user_uuid
    AND current_step = step_name;

    -- Log completion event
    INSERT INTO onboarding_events (
        user_id,
        event_type,
        step,
        metadata
    ) VALUES (
        user_uuid,
        'step_completed',
        step_name,
        step_metrics
    );

    -- Award founding protector badge if completed
    IF step_name = 'stealth_mode' THEN
        UPDATE user_settings
        SET badge_founding_protector = true
        WHERE id = user_uuid
        AND NOT badge_founding_protector;

        IF FOUND THEN
            INSERT INTO onboarding_events (
                user_id,
                event_type,
                step,
                metadata
            ) VALUES (
                user_uuid,
                'badge_awarded',
                'completed',
                jsonb_build_object(
                    'badge', 'founding_protector',
                    'awarded_for', 'onboarding_completion'
                )
            );
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress(user_uuid uuid)
RETURNS TABLE (
    current_step text,
    completed_steps text[],
    started_at timestamptz,
    completed_at timestamptz,
    metrics jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        op.current_step,
        op.completed_steps,
        op.started_at,
        op.completed_at,
        op.metrics
    FROM onboarding_progress op
    WHERE op.user_id = user_uuid
    ORDER BY op.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get onboarding statistics
CREATE OR REPLACE FUNCTION get_onboarding_stats(
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_started bigint,
    total_completed bigint,
    avg_completion_time interval,
    completion_rate numeric(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as started,
            COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
            AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL) as avg_time
        FROM onboarding_progress
        WHERE started_at > NOW() - (days_ago || ' days')::interval
    )
    SELECT 
        started::bigint as total_started,
        completed::bigint as total_completed,
        avg_time as avg_completion_time,
        CASE 
            WHEN started > 0 THEN 
                ROUND((completed::numeric / started::numeric) * 100, 2)
            ELSE 0
        END as completion_rate
    FROM stats;
END;
$$ LANGUAGE plpgsql;