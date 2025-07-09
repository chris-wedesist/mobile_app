/*
  # Panic Events System

  1. New Table
    - `panic_events`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Reference to auth.users
      - `triggered_at` (timestamptz) - When panic was triggered
      - `resolved_at` (timestamptz) - When panic was resolved
      - `location` (geography) - Location in PostGIS format
      - `media_urls` (text[]) - Array of media URLs (videos, photos)
      - `emergency_alerts_sent` (jsonb) - Record of sent alerts
      - `status` (text) - Current event status
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Features
    - Location tracking
    - Multiple media attachments
    - Emergency alert tracking
    - Event status management
    - Automatic timestamp management

  3. Security
    - Row-level security policies
    - User-specific access control
    - Data validation constraints
*/

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create panic_events table
CREATE TABLE public.panic_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    triggered_at timestamptz DEFAULT now() NOT NULL,
    resolved_at timestamptz,
    location geography(Point, 4326) NOT NULL,
    media_urls text[] DEFAULT '{}' NOT NULL,
    emergency_alerts_sent jsonb DEFAULT '{}' NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'active',
            'resolved',
            'false_alarm',
            'incomplete'
        ])
    ),
    CONSTRAINT valid_resolution CHECK (
        (status = 'active' AND resolved_at IS NULL) OR
        (status != 'active' AND resolved_at IS NOT NULL)
    ),
    CONSTRAINT valid_media_urls CHECK (
        array_length(media_urls, 1) <= 10  -- Maximum 10 media items
    )
);

-- Create indexes
CREATE INDEX panic_events_user_id_idx ON public.panic_events (user_id);
CREATE INDEX panic_events_status_idx ON public.panic_events (status);
CREATE INDEX panic_events_location_idx ON public.panic_events USING GIST (location);
CREATE INDEX panic_events_triggered_at_idx ON public.panic_events (triggered_at DESC);

-- Enable Row Level Security
ALTER TABLE public.panic_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own panic events" ON public.panic_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own panic events" ON public.panic_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own panic events" ON public.panic_events
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_panic_events_updated_at
    BEFORE UPDATE ON public.panic_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to resolve panic event
CREATE OR REPLACE FUNCTION resolve_panic_event(
    event_id uuid,
    resolution_status text DEFAULT 'resolved'
)
RETURNS boolean AS $$
DECLARE
    affected_rows integer;
BEGIN
    UPDATE public.panic_events
    SET 
        status = resolution_status,
        resolved_at = now(),
        updated_at = now()
    WHERE 
        id = event_id
        AND status = 'active'
        AND auth.uid() = user_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's panic events
CREATE OR REPLACE FUNCTION get_user_panic_events(
    user_uuid uuid,
    include_resolved boolean DEFAULT false,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    triggered_at timestamptz,
    resolved_at timestamptz,
    status text,
    media_urls text[],
    emergency_alerts_sent jsonb,
    location_lat double precision,
    location_lng double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.id,
        pe.triggered_at,
        pe.resolved_at,
        pe.status,
        pe.media_urls,
        pe.emergency_alerts_sent,
        ST_Y(pe.location::geometry) as lat,
        ST_X(pe.location::geometry) as lng
    FROM panic_events pe
    WHERE 
        pe.user_id = user_uuid
        AND (include_resolved OR pe.status = 'active')
        AND pe.triggered_at > NOW() - (days_ago || ' days')::interval
    ORDER BY 
        pe.triggered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to find nearby active panic events
CREATE OR REPLACE FUNCTION find_nearby_panic_events(
    lat double precision,
    lng double precision,
    radius_meters double precision DEFAULT 5000
)
RETURNS TABLE (
    id uuid,
    distance double precision,
    triggered_at timestamptz,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.id,
        ST_Distance(
            pe.location::geography,
            ST_MakePoint(lng, lat)::geography
        ) as distance,
        pe.triggered_at,
        pe.status
    FROM panic_events pe
    WHERE 
        ST_DWithin(
            pe.location::geography,
            ST_MakePoint(lng, lat)::geography,
            radius_meters
        )
        AND pe.status = 'active'
        AND pe.triggered_at > NOW() - INTERVAL '1 hour'
    ORDER BY 
        distance ASC;
END;
$$ LANGUAGE plpgsql;