-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_cleanup_history;

-- Update media_cleanup_events table constraints if it exists
DO $$ 
BEGIN
  -- Add new constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_cleanup_type'
  ) THEN
    ALTER TABLE media_cleanup_events 
    ADD CONSTRAINT valid_cleanup_type CHECK (
      cleanup_type = ANY (ARRAY[
        'auto_wipe',
        'manual_wipe',
        'orphaned_cleanup',
        'system_cleanup'
      ])
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_status'
  ) THEN
    ALTER TABLE media_cleanup_events 
    ADD CONSTRAINT valid_status CHECK (
      status = ANY (ARRAY[
        'success',
        'failed',
        'partial'
      ])
    );
  END IF;
END $$;

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