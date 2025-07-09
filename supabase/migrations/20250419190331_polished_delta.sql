/*
  # Hero Stories System Update

  1. Updates
    - Add category and tags fields
    - Add search functionality
    - Add trending stories function
    
  2. Changes
    - Add new indexes for performance
    - Update existing functions
    - Add search capabilities
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_trending_hero_stories;
DROP FUNCTION IF EXISTS search_hero_stories;

-- Add new columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hero_stories' AND column_name = 'category') THEN
        ALTER TABLE hero_stories ADD COLUMN category text DEFAULT 'general' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hero_stories' AND column_name = 'tags') THEN
        ALTER TABLE hero_stories ADD COLUMN tags text[] DEFAULT '{}' NOT NULL;
    END IF;
END $$;

-- Add new constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'valid_category') THEN
        ALTER TABLE hero_stories ADD CONSTRAINT valid_category CHECK (
            category = ANY (ARRAY[
                'general',
                'community_support',
                'legal_victory',
                'peaceful_resolution',
                'police_accountability',
                'civil_rights',
                'other'
            ])
        );
    END IF;
END $$;

-- Create new indexes
CREATE INDEX IF NOT EXISTS hero_stories_category_idx ON public.hero_stories (category);
CREATE INDEX IF NOT EXISTS hero_stories_tags_idx ON public.hero_stories USING GIN (tags);

-- Create helper function to get trending stories
CREATE OR REPLACE FUNCTION get_trending_hero_stories(
    limit_count integer DEFAULT 10,
    days_ago integer DEFAULT 7,
    category_filter text DEFAULT NULL,
    tag_filter text[] DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    story text,
    media_url text,
    submitted_at timestamptz,
    votes integer,
    verified boolean,
    category text,
    tags text[]
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
        hs.verified,
        hs.category,
        hs.tags
    FROM hero_stories hs
    WHERE 
        hs.status = 'approved'
        AND hs.submitted_at > NOW() - (days_ago || ' days')::interval
        AND (category_filter IS NULL OR hs.category = category_filter)
        AND (tag_filter IS NULL OR hs.tags && tag_filter)
    ORDER BY 
        hs.verified DESC,      -- Verified stories first
        hs.votes DESC,         -- Most voted next
        hs.submitted_at DESC   -- Most recent last
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to search hero stories
CREATE OR REPLACE FUNCTION search_hero_stories(
    search_query text,
    category_filter text DEFAULT NULL,
    tag_filter text[] DEFAULT NULL,
    limit_count integer DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    title text,
    story text,
    media_url text,
    submitted_at timestamptz,
    votes integer,
    verified boolean,
    category text,
    tags text[]
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
        hs.verified,
        hs.category,
        hs.tags
    FROM hero_stories hs
    WHERE 
        hs.status = 'approved'
        AND (
            hs.title ILIKE '%' || search_query || '%'
            OR hs.story ILIKE '%' || search_query || '%'
            OR search_query = ANY(hs.tags)
        )
        AND (category_filter IS NULL OR hs.category = category_filter)
        AND (tag_filter IS NULL OR hs.tags && tag_filter)
    ORDER BY 
        ts_rank(
            to_tsvector('english', hs.title || ' ' || hs.story),
            to_tsquery('english', search_query)
        ) DESC,
        hs.votes DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;