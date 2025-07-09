/*
  # Create upload tracking table

  1. New Tables
    - `media_uploads`
      - Track upload status and metadata
      - Link to related records
      - Store processing status
      
  2. Security
    - RLS enabled
    - Policies for user access
*/

-- Create media_uploads table
CREATE TABLE public.media_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    file_path text NOT NULL,
    public_url text,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    upload_status text DEFAULT 'pending' NOT NULL,
    processing_status text DEFAULT 'pending' NOT NULL,
    related_record_id uuid,
    related_record_type text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_upload_status CHECK (
        upload_status = ANY (ARRAY[
            'pending',
            'uploading',
            'completed',
            'failed'
        ])
    ),
    CONSTRAINT valid_processing_status CHECK (
        processing_status = ANY (ARRAY[
            'pending',
            'processing',
            'completed',
            'failed'
        ])
    ),
    CONSTRAINT valid_file_type CHECK (
        file_type = ANY (ARRAY[
            'video/mp4',
            'image/jpeg',
            'image/png',
            'audio/mp3',
            'audio/wav'
        ])
    )
);

-- Create indexes
CREATE INDEX media_uploads_user_id_idx ON public.media_uploads (user_id);
CREATE INDEX media_uploads_status_idx ON public.media_uploads (upload_status, processing_status);
CREATE INDEX media_uploads_related_record_idx ON public.media_uploads (related_record_id);

-- Enable Row Level Security
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own uploads" ON public.media_uploads
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON public.media_uploads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON public.media_uploads
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_media_uploads_updated_at
    BEFORE UPDATE ON public.media_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get upload status
CREATE OR REPLACE FUNCTION get_upload_status(
    record_id uuid,
    record_type text
)
RETURNS TABLE (
    id uuid,
    file_path text,
    public_url text,
    upload_status text,
    processing_status text,
    metadata jsonb,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mu.id,
        mu.file_path,
        mu.public_url,
        mu.upload_status,
        mu.processing_status,
        mu.metadata,
        mu.created_at
    FROM media_uploads mu
    WHERE 
        mu.related_record_id = record_id
        AND mu.related_record_type = record_type
    ORDER BY mu.created_at DESC;
END;
$$ LANGUAGE plpgsql;