/*
  # Hero Stories System

  1. New Table
    - `hero_stories`
      - `id` (uuid, primary key) - Unique identifier
      - `title` (text) - Story title
      - `story` (text) - Main story content
      - `media_url` (text) - Optional media attachment URL
      - `submitted_at` (timestamptz) - Submission timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `status` (text) - Moderation status
      - `votes` (integer) - Community votes/likes
      - `verified` (boolean) - Official verification status
    
  2. Security
    - Enable RLS
    - Public read access for approved stories
    - Public write access for story submission
    - Moderation controls for status updates
    
  3. Changes
    - Added status field for moderation
    - Added verification system
    - Added voting system
    - Added updated_at timestamp
*/

-- Create hero_stories table with enhanced features
CREATE TABLE public.hero_stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    story text NOT NULL,
    media_url text,
    submitted_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    votes integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,

    -- Add constraints
    CONSTRAINT valid_votes CHECK (votes >= 0),
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'pending',
            'approved',
            'rejected',
            'flagged'
        ])
    )
);

-- Create indexes
CREATE INDEX hero_stories_status_idx ON public.hero_stories (status);
CREATE INDEX hero_stories_votes_idx ON public.hero_stories (votes DESC);
CREATE INDEX hero_stories_submitted_at_idx ON public.hero_stories (submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.hero_stories ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow public select approved stories" ON public.hero_stories
    FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Allow public insert" ON public.hero_stories
    FOR INSERT
    WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER set_hero_stories_updated_at
    BEFORE UPDATE ON public.hero_stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get trending stories
CREATE OR REPLACE FUNCTION get_trending_hero_stories(
    limit_count integer DEFAULT 10,
    days_ago integer DEFAULT 7
)
RETURNS TABLE (
    id uuid,
    title text,
    story text,
    media_url text,
    submitted_at timestamptz,
    votes integer,
    verified boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hs.id,
        hs.title,
        hs.story,
        hs.media_url,
        hs.submitted_at,
        hs.votes,
        hs.verified
    FROM hero_stories hs
    WHERE 
        hs.status = 'approved'
        AND hs.submitted_at > NOW() - (days_ago || ' days')::interval
    ORDER BY 
        hs.verified DESC,      -- Verified stories first
        hs.votes DESC,         -- Most voted next
        hs.submitted_at DESC   -- Most recent last
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;