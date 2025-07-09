/*
  # Media Cleanup History Function

  1. New Function
    - get_cleanup_history: Retrieve cleanup event history with filtering
    
  2. Changes
    - Remove duplicate table creation
    - Keep helper function for querying cleanup events
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_cleanup_history;

-- Create helper function to get cleanup history
CREATE OR REPLACE FUNCTION get_cleanup_history(
    p_days_ago integer DEFAULT 7,
    p_cleanup_type text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    file_path text,
    cleanup_type text,
    status text,
    error_message text,
    metadata jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mce.id,
        mce.file_path,
        mce.cleanup_type,
        mce.status,
        mce.error_message,
        mce.metadata,
        mce.created_at
    FROM media_cleanup_events mce
    WHERE 
        mce.created_at > NOW() - (p_days_ago || ' days')::interval
        AND (p_cleanup_type IS NULL OR mce.cleanup_type = p_cleanup_type)
    ORDER BY mce.created_at DESC;
END;
$$ LANGUAGE plpgsql;