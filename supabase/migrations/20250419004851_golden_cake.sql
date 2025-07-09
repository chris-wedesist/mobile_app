/*
  # Cover Story Events Tracking

  1. New Tables
    - `cover_story_events`: Track cover story activations
      - Basic event info (id, action, timestamp)
      - Platform details
      - Activation metadata
      
  2. Security
    - RLS enabled
    - Policies for system access
*/

-- Create cover_story_events table
CREATE TABLE public.cover_story_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    timestamp timestamptz DEFAULT now() NOT NULL,
    platform text NOT NULL,
    metadata jsonb DEFAULT '{}',

    -- Add constraints
    CONSTRAINT valid_action CHECK (
        action = ANY (ARRAY[
            'activated',
            'deactivated'
        ])
    ),
    CONSTRAINT valid_platform CHECK (
        platform = ANY (ARRAY[
            'web',
            'ios',
            'android'
        ])
    )
);

-- Create indexes
CREATE INDEX cover_story_events_action_idx ON public.cover_story_events (action);
CREATE INDEX cover_story_events_timestamp_idx ON public.cover_story_events (timestamp DESC);
CREATE INDEX cover_story_events_platform_idx ON public.cover_story_events (platform);

-- Enable Row Level Security
ALTER TABLE public.cover_story_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "System can insert events" ON public.cover_story_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can view events" ON public.cover_story_events
    FOR SELECT
    TO authenticated
    USING (true);

-- Create helper function to get cover story usage stats
CREATE OR REPLACE FUNCTION get_cover_story_stats(
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_activations bigint,
    avg_duration interval,
    platform_breakdown jsonb,
    activation_times jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH activations AS (
        SELECT 
            id,
            platform,
            timestamp as activated_at,
            LEAD(timestamp) OVER (ORDER BY timestamp) as deactivated_at
        FROM cover_story_events
        WHERE 
            timestamp > NOW() - (days_ago || ' days')::interval
            AND action = 'activated'
    )
    SELECT 
        COUNT(*)::bigint as total_activations,
        AVG(deactivated_at - activated_at) as avg_duration,
        jsonb_object_agg(
            platform,
            COUNT(*)
        ) as platform_breakdown,
        jsonb_object_agg(
            EXTRACT(HOUR FROM activated_at)::text,
            COUNT(*)
        ) as activation_times
    FROM activations;
END;
$$ LANGUAGE plpgsql;