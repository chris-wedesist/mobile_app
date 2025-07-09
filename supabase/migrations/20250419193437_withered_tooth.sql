/*
  # Update Safe Encounters System

  1. Add Indexes
    - Add spatial index for location queries
    - Add index for encounter type and occurred_at
    
  2. Add Helper Functions
    - Function to find nearby encounters
    - Improved spatial queries
*/

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'safe_encounters' 
        AND indexname = 'safe_encounters_location_idx'
    ) THEN
        CREATE INDEX safe_encounters_location_idx ON public.safe_encounters USING GIST (location);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'safe_encounters' 
        AND indexname = 'safe_encounters_type_idx'
    ) THEN
        CREATE INDEX safe_encounters_type_idx ON public.safe_encounters (encounter_type);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'safe_encounters' 
        AND indexname = 'safe_encounters_occurred_at_idx'
    ) THEN
        CREATE INDEX safe_encounters_occurred_at_idx ON public.safe_encounters (occurred_at DESC);
    END IF;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS find_nearby_safe_encounters;

-- Create helper function to find nearby safe encounters
CREATE OR REPLACE FUNCTION find_nearby_safe_encounters(
    lat double precision,
    lng double precision,
    radius_meters double precision DEFAULT 5000,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    encounter_type text,
    description text,
    distance double precision,
    occurred_at timestamptz,
    verified boolean,
    media_url text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.encounter_type,
        se.description,
        ST_Distance(
            se.location::geography,
            ST_MakePoint(lng, lat)::geography
        ) as distance,
        se.occurred_at,
        se.verified,
        se.media_url
    FROM safe_encounters se
    WHERE 
        ST_DWithin(
            se.location::geography,
            ST_MakePoint(lng, lat)::geography,
            radius_meters
        )
        AND se.occurred_at > NOW() - (days_ago || ' days')::interval
        AND se.flag_count < 3  -- Filter out heavily flagged encounters
    ORDER BY 
        se.verified DESC,      -- Verified encounters first
        distance ASC,          -- Closest encounters next
        se.occurred_at DESC;   -- Most recent last
END;
$$ LANGUAGE plpgsql;