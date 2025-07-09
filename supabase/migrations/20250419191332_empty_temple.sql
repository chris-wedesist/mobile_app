/*
  # Media Cleanup System

  1. New Tables
    - `media_cleanup_events`: Track all media cleanup operations
      - Basic info (id, file path, cleanup type)
      - Status tracking
      - Error handling
      - Metadata storage
    
  2. Features
    - Multiple cleanup types (auto-wipe, manual, orphaned)
    - Status tracking
    - Error logging
    - Metadata storage
    
  3. Security
    - RLS enabled
    - System-level access control
*/

-- Create media_cleanup_events table
CREATE TABLE public.media_cleanup_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path text NOT NULL,
    cleanup_type text NOT NULL,
    status text NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_cleanup_type CHECK (
        cleanup_type = ANY (ARRAY[
            'auto_wipe',
            'manual_wipe',
            'orphaned_cleanup',
            'system_cleanup'
        ])
    ),
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'pending',
            'in_progress',
            'completed',
            'failed',
            'verified'
        ])
    )
);

-- Create indexes
CREATE INDEX media_cleanup_events_type_idx ON public.media_cleanup_events (cleanup_type);
CREATE INDEX media_cleanup_events_status_idx ON public.media_cleanup_events (status);
CREATE INDEX media_cleanup_events_created_at_idx ON public.media_cleanup_events (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.media_cleanup_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "System can manage cleanup events" ON public.media_cleanup_events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER set_media_cleanup_events_updated_at
    BEFORE UPDATE ON public.media_cleanup_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initiate media cleanup
CREATE OR REPLACE FUNCTION initiate_media_cleanup(
    p_file_path text,
    p_cleanup_type text,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    v_cleanup_id uuid;
BEGIN
    INSERT INTO media_cleanup_events (
        file_path,
        cleanup_type,
        status,
        metadata
    ) VALUES (
        p_file_path,
        p_cleanup_type,
        'pending',
        p_metadata
    )
    RETURNING id INTO v_cleanup_id;

    RETURN v_cleanup_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update cleanup status
CREATE OR REPLACE FUNCTION update_cleanup_status(
    p_cleanup_id uuid,
    p_status text,
    p_error_message text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    UPDATE media_cleanup_events
    SET 
        status = p_status,
        error_message = COALESCE(p_error_message, error_message),
        metadata = metadata || p_metadata,
        updated_at = now()
    WHERE id = p_cleanup_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending cleanups
CREATE OR REPLACE FUNCTION get_pending_cleanups(
    p_cleanup_type text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    file_path text,
    cleanup_type text,
    metadata jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mce.id,
        mce.file_path,
        mce.cleanup_type,
        mce.metadata,
        mce.created_at
    FROM media_cleanup_events mce
    WHERE 
        mce.status = 'pending'
        AND (p_cleanup_type IS NULL OR mce.cleanup_type = p_cleanup_type)
    ORDER BY mce.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to verify cleanup completion
CREATE OR REPLACE FUNCTION verify_cleanup_completion(
    p_cleanup_id uuid,
    p_verification_metadata jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
    v_status text;
BEGIN
    SELECT status INTO v_status
    FROM media_cleanup_events
    WHERE id = p_cleanup_id;

    IF v_status = 'completed' THEN
        UPDATE media_cleanup_events
        SET 
            status = 'verified',
            metadata = metadata || jsonb_build_object(
                'verified_at', now(),
                'verification_data', p_verification_metadata
            ),
            updated_at = now()
        WHERE id = p_cleanup_id;
        
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cleanup statistics
CREATE OR REPLACE FUNCTION get_cleanup_stats(
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_cleanups bigint,
    successful_cleanups bigint,
    failed_cleanups bigint,
    pending_cleanups bigint,
    avg_cleanup_time interval
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_cleanups,
        COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))::bigint as successful_cleanups,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_cleanups,
        COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending_cleanups,
        AVG(updated_at - created_at) FILTER (WHERE status IN ('completed', 'verified')) as avg_cleanup_time
    FROM media_cleanup_events
    WHERE created_at > NOW() - (days_ago || ' days')::interval;
END;
$$ LANGUAGE plpgsql;