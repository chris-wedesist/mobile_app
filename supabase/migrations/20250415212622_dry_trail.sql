/*
  # Add Incident Recordings and Comments

  1. New Tables
    - `incident_recordings`: Store video recordings of incidents
      - Basic info (id, title, description)
      - Media URLs (video, thumbnail)
      - Engagement metrics (shares, views, downloads)
      - YouTube integration
      - Status tracking
    
    - `incident_comments`: Store user comments on recordings
      - Comment content
      - Relationship to recordings
      - Timestamps
      
  2. Security
    - RLS enabled for both tables
    - Policies for viewing public content
    - Policies for user-specific actions
    
  3. Triggers
    - Auto-update timestamps
*/

-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create incident_recordings table if it doesn't exist
CREATE TABLE IF NOT EXISTS incident_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  share_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  youtube_url text,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'public', 'private', 'deleted'))
);

-- Create incident_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS incident_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES incident_recordings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE incident_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view public recordings" ON incident_recordings;
  DROP POLICY IF EXISTS "Users can create recordings" ON incident_recordings;
  DROP POLICY IF EXISTS "Users can update their own recordings" ON incident_recordings;
  DROP POLICY IF EXISTS "Anyone can view comments on public recordings" ON incident_comments;
  DROP POLICY IF EXISTS "Authenticated users can create comments" ON incident_comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON incident_comments;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies for incident_recordings
CREATE POLICY "Users can view public recordings"
  ON incident_recordings
  FOR SELECT
  USING (status = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can create recordings"
  ON incident_recordings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON incident_recordings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for incident_comments
CREATE POLICY "Anyone can view comments on public recordings"
  ON incident_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incident_recordings
      WHERE id = recording_id
      AND (status = 'public' OR auth.uid() = user_id)
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON incident_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON incident_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_incident_recordings_updated_at ON incident_recordings;
DROP TRIGGER IF EXISTS update_incident_comments_updated_at ON incident_comments;

-- Create triggers
CREATE TRIGGER update_incident_recordings_updated_at
  BEFORE UPDATE ON incident_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_comments_updated_at
  BEFORE UPDATE ON incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();