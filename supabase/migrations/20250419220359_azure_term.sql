-- Add notification preferences to user_settings table
ALTER TABLE user_settings
ADD COLUMN notification_frequency text DEFAULT 'daily' NOT NULL,
ADD COLUMN notification_types jsonb DEFAULT '{
  "local_incidents": true,
  "us_incidents": true,
  "legal_updates": true,
  "civil_rights": true,
  "immigration": true,
  "policing": true
}'::jsonb NOT NULL,
ADD COLUMN notification_radius integer DEFAULT 50 NOT NULL, -- in kilometers
ADD COLUMN last_notification_check timestamptz;

-- Add constraint for valid notification frequency
ALTER TABLE user_settings
ADD CONSTRAINT valid_notification_frequency 
CHECK (notification_frequency = ANY (ARRAY['hourly', 'daily', 'weekly', 'custom']));

-- Create notifications table for storing notification content
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    location geography(Point, 4326),
    source_url text,
    source_name text,
    importance text DEFAULT 'normal' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,

    CONSTRAINT valid_notification_type CHECK (
        type = ANY (ARRAY[
            'local_incident',
            'us_incident',
            'legal_update',
            'civil_rights',
            'immigration',
            'policing'
        ])
    ),
    CONSTRAINT valid_importance CHECK (
        importance = ANY (ARRAY[
            'low',
            'normal',
            'high',
            'urgent'
        ])
    )
);

-- Create indexes for notifications
CREATE INDEX notifications_type_idx ON public.notifications (type);
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);
CREATE INDEX notifications_location_idx ON public.notifications USING GIST (location);
CREATE INDEX notifications_importance_idx ON public.notifications (importance);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications" ON public.notifications
    FOR SELECT
    USING (true);  -- All authenticated users can view notifications

-- Create function to get relevant notifications for a user
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_uuid uuid,
    hours_ago integer DEFAULT 24
)
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    content text,
    location_lat double precision,
    location_lng double precision,
    source_url text,
    source_name text,
    importance text,
    created_at timestamptz
) AS $$
DECLARE
    user_location geography;
    notification_radius integer;
    notification_types jsonb;
BEGIN
    -- Get user's notification preferences
    SELECT 
        notification_radius,
        notification_types
    INTO 
        notification_radius,
        notification_types
    FROM user_settings
    WHERE user_id = user_uuid;

    -- Get user's location from their last known position
    SELECT location INTO user_location
    FROM user_locations
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.content,
        ST_Y(n.location::geometry) as lat,
        ST_X(n.location::geometry) as lng,
        n.source_url,
        n.source_name,
        n.importance,
        n.created_at
    FROM notifications n
    WHERE 
        n.created_at > NOW() - (hours_ago || ' hours')::interval
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
        AND notification_types->n.type = 'true'
        AND (
            -- Include notifications without location
            n.location IS NULL
            OR
            -- Include notifications within user's radius
            (user_location IS NOT NULL AND 
             ST_DWithin(
                n.location::geography,
                user_location,
                notification_radius * 1000  -- Convert km to meters
             ))
        )
    ORDER BY 
        CASE n.importance
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notifications as checked
CREATE OR REPLACE FUNCTION mark_notifications_checked(user_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE user_settings
    SET last_notification_check = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql; 