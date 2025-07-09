/*
  # Fix SMS History Function

  1. Changes
    - Drop all existing SMS history functions with conflicting signatures
    - Create a single, consistent get_sms_history function
    - Ensure proper parameter handling and return types
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop all existing SMS history functions with their specific signatures
DROP FUNCTION IF EXISTS get_sms_history(uuid);
DROP FUNCTION IF EXISTS get_sms_history(uuid, integer);
DROP FUNCTION IF EXISTS get_sms_history(uuid, integer, text);

-- Create a single, consistent get_sms_history function
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

-- Create a simplified version for basic queries
CREATE OR REPLACE FUNCTION get_recent_sms(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    contact_name text,
    message text,
    sent_at timestamptz,
    status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.contact_name,
        se.message,
        se.sent_at,
        se.status
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
    ORDER BY se.sent_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;