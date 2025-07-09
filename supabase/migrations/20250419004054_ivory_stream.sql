/*
  # Trust Metrics System

  1. New Table
    - `trust_metrics`
      - `id` (uuid, primary key) - Unique identifier
      - `total_encounters` (integer) - Total number of encounters
      - `total_verified` (integer) - Number of verified encounters
      - `total_flagged` (integer) - Number of flagged encounters
      - `trust_score` (decimal) - Calculated trust score
      - `last_updated` (timestamptz) - Last update timestamp
      - `created_at` (timestamptz) - Creation timestamp
    
  2. Features
    - Automatic trust score calculation
    - Encounter verification tracking
    - Flag tracking for suspicious activity
    - Historical metrics tracking
    
  3. Security
    - Public read access for transparency
    - Protected write access
    - Validation constraints for data integrity
*/

-- Create trust_metrics table with enhanced features
CREATE TABLE public.trust_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    total_encounters integer DEFAULT 0 NOT NULL,
    total_verified integer DEFAULT 0 NOT NULL,
    total_flagged integer DEFAULT 0 NOT NULL,
    trust_score decimal(5,2) DEFAULT 0.00 NOT NULL,
    last_updated timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_encounters CHECK (total_encounters >= 0),
    CONSTRAINT valid_verified CHECK (total_verified >= 0),
    CONSTRAINT valid_flagged CHECK (total_flagged >= 0),
    CONSTRAINT valid_trust_score CHECK (
        trust_score >= 0.00 
        AND trust_score <= 100.00
    ),
    CONSTRAINT verified_less_than_total CHECK (
        total_verified <= total_encounters
    ),
    CONSTRAINT flagged_less_than_total CHECK (
        total_flagged <= total_encounters
    )
);

-- Create indexes
CREATE INDEX trust_metrics_score_idx ON public.trust_metrics (trust_score DESC);
CREATE INDEX trust_metrics_last_updated_idx ON public.trust_metrics (last_updated DESC);

-- Enable Row Level Security
ALTER TABLE public.trust_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow public read access" ON public.trust_metrics
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert" ON public.trust_metrics
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.trust_metrics
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(
    p_total integer,
    p_verified integer,
    p_flagged integer
) RETURNS decimal AS $$
DECLARE
    base_score decimal;
    flag_penalty decimal;
BEGIN
    -- Base score from verification ratio (0-80 points)
    IF p_total = 0 THEN
        base_score := 0;
    ELSE
        base_score := (p_verified::decimal / p_total::decimal) * 80;
    END IF;

    -- Flag penalty (up to -20 points)
    IF p_total = 0 THEN
        flag_penalty := 0;
    ELSE
        flag_penalty := (p_flagged::decimal / p_total::decimal) * 20;
    END IF;

    -- Return final score (0-100)
    RETURN GREATEST(0, LEAST(100, base_score - flag_penalty));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update trust score
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trust_score := calculate_trust_score(
        NEW.total_encounters,
        NEW.total_verified,
        NEW.total_flagged
    );
    NEW.last_updated := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_metrics_score
    BEFORE INSERT OR UPDATE ON public.trust_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_score();

-- Create helper function to get trust metrics summary
CREATE OR REPLACE FUNCTION get_trust_metrics_summary()
RETURNS TABLE (
    total_encounters bigint,
    total_verified bigint,
    total_flagged bigint,
    average_trust_score decimal,
    last_updated timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(tm.total_encounters)::bigint,
        SUM(tm.total_verified)::bigint,
        SUM(tm.total_flagged)::bigint,
        AVG(tm.trust_score)::decimal(5,2),
        MAX(tm.last_updated)
    FROM trust_metrics tm;
END;
$$ LANGUAGE plpgsql;