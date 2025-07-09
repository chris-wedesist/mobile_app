/*
  # Cloud Upload Handler System

  1. New Tables
    - `upload_queue`: Track pending and failed uploads
    - `upload_events`: Log upload attempts and results
    
  2. Features
    - Automatic retry system
    - Upload status tracking
    - Event logging
    
  3. Security
    - RLS enabled
    - Protected write access
*/

-- Create upload_queue table
CREATE TABLE public.upload_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path text NOT NULL,
    destination text NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamptz,
    status text DEFAULT 'pending' NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled'
        ])
    ),
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- Create upload_events table
CREATE TABLE public.upload_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_item_id uuid REFERENCES upload_queue(id),
    event_type text NOT NULL,
    file_path text NOT NULL,
    destination text NOT NULL,
    success boolean NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_event_type CHECK (
        event_type = ANY (ARRAY[
            'upload_attempt',
            'upload_success',
            'upload_failure',
            'retry_scheduled',
            'cancelled'
        ])
    )
);

-- Create indexes
CREATE INDEX upload_queue_status_idx ON public.upload_queue (status);
CREATE INDEX upload_queue_next_retry_idx ON public.upload_queue (next_retry_at);
CREATE INDEX upload_events_queue_item_idx ON public.upload_events (queue_item_id);
CREATE INDEX upload_events_type_idx ON public.upload_events (event_type);
CREATE INDEX upload_events_created_at_idx ON public.upload_events (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.upload_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "System can manage upload queue" ON public.upload_queue
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "System can manage upload events" ON public.upload_events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger for upload_queue
CREATE TRIGGER set_upload_queue_updated_at
    BEFORE UPDATE ON public.upload_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to queue upload
CREATE OR REPLACE FUNCTION queue_upload(
    p_file_path text,
    p_destination text,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    v_queue_id uuid;
BEGIN
    INSERT INTO upload_queue (
        file_path,
        destination,
        metadata
    ) VALUES (
        p_file_path,
        p_destination,
        p_metadata
    )
    RETURNING id INTO v_queue_id;

    -- Log initial queue event
    INSERT INTO upload_events (
        queue_item_id,
        event_type,
        file_path,
        destination,
        success,
        metadata
    ) VALUES (
        v_queue_id,
        'upload_attempt',
        p_file_path,
        p_destination,
        false,
        p_metadata
    );

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle upload failure
CREATE OR REPLACE FUNCTION handle_upload_failure(
    p_queue_id uuid,
    p_error_message text,
    p_retry_after_minutes integer DEFAULT 5
)
RETURNS void AS $$
BEGIN
    -- Update queue item
    UPDATE upload_queue
    SET 
        status = CASE 
            WHEN retry_count >= 3 THEN 'failed'
            ELSE 'pending'
        END,
        retry_count = retry_count + 1,
        next_retry_at = CASE 
            WHEN retry_count >= 3 THEN NULL
            ELSE now() + (p_retry_after_minutes || ' minutes')::interval
        END,
        error_message = p_error_message,
        updated_at = now()
    WHERE id = p_queue_id;

    -- Log failure event
    INSERT INTO upload_events (
        queue_item_id,
        event_type,
        file_path,
        destination,
        success,
        error_message
    )
    SELECT
        id,
        'upload_failure',
        file_path,
        destination,
        false,
        p_error_message
    FROM upload_queue
    WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark upload as complete
CREATE OR REPLACE FUNCTION complete_upload(
    p_queue_id uuid,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    -- Update queue item
    UPDATE upload_queue
    SET 
        status = 'completed',
        updated_at = now(),
        metadata = metadata || p_metadata
    WHERE id = p_queue_id;

    -- Log success event
    INSERT INTO upload_events (
        queue_item_id,
        event_type,
        file_path,
        destination,
        success,
        metadata
    )
    SELECT
        id,
        'upload_success',
        file_path,
        destination,
        true,
        p_metadata
    FROM upload_queue
    WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending uploads
CREATE OR REPLACE FUNCTION get_pending_uploads(
    max_retries integer DEFAULT 3
)
RETURNS TABLE (
    id uuid,
    file_path text,
    destination text,
    retry_count integer,
    metadata jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uq.id,
        uq.file_path,
        uq.destination,
        uq.retry_count,
        uq.metadata
    FROM upload_queue uq
    WHERE 
        uq.status = 'pending'
        AND uq.retry_count < max_retries
        AND (
            uq.next_retry_at IS NULL 
            OR uq.next_retry_at <= now()
        )
    ORDER BY uq.created_at ASC;
END;
$$ LANGUAGE plpgsql;