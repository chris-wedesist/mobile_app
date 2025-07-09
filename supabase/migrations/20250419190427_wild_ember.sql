/*
  # Trust Events System

  1. New Tables
    - `trust_events`: Track trust-related activities
      - Basic event info (id, type, scores)
      - Relationship to encounters
      - Event metadata
      
  2. Security
    - RLS enabled
    - Public read access
    - System insert access
*/

-- Create trust_events table to track trust-related activities
CREATE TABLE public.trust_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    previous_score decimal(5,2),
    new_score decimal(5,2),
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),

    -- Add constraints
    CONSTRAINT valid_event_type CHECK (
        event_type = ANY (ARRAY[
            'verification',
            'flag',
            'system_adjustment',
            'manual_review'
        ])
    )
);

-- Create indexes
CREATE INDEX trust_events_type_idx ON public.trust_events (event_type);
CREATE INDEX trust_events_created_at_idx ON public.trust_events (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow public read access" ON public.trust_events
    FOR SELECT
    USING (true);

CREATE POLICY "Allow system insert" ON public.trust_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create function to get trust event history
CREATE OR REPLACE FUNCTION get_trust_event_history(
    event_type_filter text DEFAULT NULL,
    limit_count integer DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    event_type text,
    previous_score decimal,
    new_score decimal,
    details jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id,
        te.event_type,
        te.previous_score,
        te.new_score,
        te.details,
        te.created_at
    FROM trust_events te
    WHERE 
        event_type_filter IS NULL 
        OR te.event_type = event_type_filter
    ORDER BY te.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add encounter_id column after safe_encounters table is created
DO $$ 
BEGIN
    ALTER TABLE trust_events 
    ADD COLUMN encounter_id uuid REFERENCES safe_encounters(id);

    CREATE INDEX trust_events_encounter_idx ON public.trust_events (encounter_id);
EXCEPTION
    WHEN undefined_table THEN
        -- Safe encounters table doesn't exist yet, skip adding the column
        NULL;
END $$;