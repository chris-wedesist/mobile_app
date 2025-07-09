/*
  # Core Event Tracking System

  1. New Tables
    - `cover_story_events`: Track stealth mode activations
    - `emergency_alerts_log`: Track emergency alert sending
    - `trust_scores`: Track user trust metrics
    - `badges_unlocked`: Track badge awards
*/

-- Create cover_story_events table
CREATE TABLE IF NOT EXISTS cover_story_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL,
    platform text NOT NULL,
    screen_type text NOT NULL,
    activated_at timestamptz DEFAULT now() NOT NULL,
    deactivated_at timestamptz,
    duration_ms integer,
    trigger_type text NOT NULL,
    metadata jsonb DEFAULT '{}',

    CONSTRAINT valid_action CHECK (
        action = ANY (ARRAY[
            'activated',
            'deactivated',
            'auto_activated',
            'force_deactivated'
        ])
    ),
    CONSTRAINT valid_platform CHECK (
        platform = ANY (ARRAY[
            'web',
            'ios',
            'android'
        ])
    ),
    CONSTRAINT valid_screen_type CHECK (
        screen_type = ANY (ARRAY[
            'notes',
            'calculator',
            'calendar',
            'browser'
        ])
    ),
    CONSTRAINT valid_trigger_type CHECK (
        trigger_type = ANY (ARRAY[
            'manual',
            'auto_background',
            'gesture',
            'volume_buttons',
            'shake',
            'system'
        ])
    )
);

-- Create emergency_alerts_log table
CREATE TABLE IF NOT EXISTS emergency_alerts_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    alert_time timestamptz DEFAULT now() NOT NULL,
    location geography(Point, 4326) NOT NULL,
    alert_type text NOT NULL,
    recipients jsonb NOT NULL,
    status text NOT NULL,
    error_message text,
    metadata jsonb DEFAULT '{}',

    CONSTRAINT valid_alert_type CHECK (
        alert_type = ANY (ARRAY[
            'panic',
            'medical',
            'legal',
            'general'
        ])
    ),
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'pending',
            'sent',
            'delivered',
            'failed'
        ])
    )
);

-- Create trust_scores table
CREATE TABLE IF NOT EXISTS trust_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    total_encounters integer DEFAULT 0 NOT NULL,
    verified_encounters integer DEFAULT 0 NOT NULL,
    flagged_encounters integer DEFAULT 0 NOT NULL,
    trust_score_percent numeric(5,2) DEFAULT 0 NOT NULL,
    last_calculated_at timestamptz DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}',

    CONSTRAINT valid_trust_score CHECK (
        trust_score_percent >= 0 
        AND trust_score_percent <= 100
    ),
    CONSTRAINT valid_encounter_counts CHECK (
        verified_encounters <= total_encounters
        AND flagged_encounters <= total_encounters
    )
);

-- Create badges_unlocked table
CREATE TABLE IF NOT EXISTS badges_unlocked (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    badge_name text NOT NULL,
    unlocked_at timestamptz DEFAULT now() NOT NULL,
    requirements_met jsonb NOT NULL,
    metadata jsonb DEFAULT '{}',

    CONSTRAINT valid_badge_name CHECK (
        badge_name = ANY (ARRAY[
            'founding_protector',
            'shield_builder',
            'emergency_sentinel',
            'evidence_guardian',
            'community_defender'
        ])
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS cover_story_events_user_idx ON cover_story_events(user_id);
CREATE INDEX IF NOT EXISTS cover_story_events_action_idx ON cover_story_events(action);
CREATE INDEX IF NOT EXISTS cover_story_events_activated_at_idx ON cover_story_events(activated_at DESC);

CREATE INDEX IF NOT EXISTS emergency_alerts_location_idx ON emergency_alerts_log USING GIST(location);
CREATE INDEX IF NOT EXISTS emergency_alerts_user_idx ON emergency_alerts_log(user_id);
CREATE INDEX IF NOT EXISTS emergency_alerts_time_idx ON emergency_alerts_log(alert_time DESC);
CREATE INDEX IF NOT EXISTS emergency_alerts_status_idx ON emergency_alerts_log(status);

CREATE INDEX IF NOT EXISTS trust_scores_user_idx ON trust_scores(user_id);
CREATE INDEX IF NOT EXISTS trust_scores_score_idx ON trust_scores(trust_score_percent DESC);

CREATE INDEX IF NOT EXISTS badges_unlocked_user_idx ON badges_unlocked(user_id);
CREATE INDEX IF NOT EXISTS badges_unlocked_badge_idx ON badges_unlocked(badge_name);
CREATE INDEX IF NOT EXISTS badges_unlocked_time_idx ON badges_unlocked(unlocked_at DESC);

-- Enable RLS
ALTER TABLE cover_story_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_unlocked ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own cover story events" ON cover_story_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cover story events" ON cover_story_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own emergency alerts" ON emergency_alerts_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency alerts" ON emergency_alerts_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own trust score" ON trust_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update trust scores" ON trust_scores
    FOR ALL USING (true);

CREATE POLICY "Users can view own badges" ON badges_unlocked
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges" ON badges_unlocked
    FOR INSERT WITH CHECK (true);

-- Create helper function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(
    p_total integer,
    p_verified integer,
    p_flagged integer
)
RETURNS numeric AS $$
DECLARE
    base_score numeric;
    penalty numeric;
BEGIN
    IF p_total = 0 THEN
        base_score := 0;
    ELSE
        base_score := (p_verified::numeric / p_total::numeric) * 80;
    END IF;

    IF p_total = 0 THEN
        penalty := 0;
    ELSE
        penalty := (p_flagged::numeric / p_total::numeric) * 20;
    END IF;

    RETURN GREATEST(0, LEAST(100, base_score - penalty));
END;
$$ LANGUAGE plpgsql;

-- Create function to update trust score
CREATE OR REPLACE FUNCTION update_trust_score(p_user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE trust_scores
    SET 
        trust_score_percent = calculate_trust_score(
            total_encounters,
            verified_encounters,
            flagged_encounters
        ),
        last_calculated_at = now()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;