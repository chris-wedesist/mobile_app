/*
  # Create SMS events tracking table

  1. New Tables
    - `sms_events`
      - Track all SMS messages sent through the system
      - Store message content and metadata
      - Track delivery status
      
  2. Security
    - RLS enabled
    - Policies for user access
*/

-- Create sms_events table
CREATE TABLE public.sms_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    contact_name text NOT NULL,
    contact_phone text NOT NULL,
    message text NOT NULL,
    location geography(Point, 4326),
    status text DEFAULT 'pending' NOT NULL,
    sent_at timestamptz DEFAULT now() NOT NULL,
    delivered_at timestamptz,
    metadata jsonb DEFAULT '{}',

    -- Add constraints
    CONSTRAINT valid_status CHECK (
        status = ANY (ARRAY[
            'pending',
            'sent',
            'delivered',
            'failed'
        ])
    ),
    CONSTRAINT valid_phone CHECK (
        contact_phone ~ '^[+]?[0-9\s-()]{10,}$'
    )
);

-- Create indexes
CREATE INDEX sms_events_user_id_idx ON public.sms_events (user_id);
CREATE INDEX sms_events_status_idx ON public.sms_events (status);
CREATE INDEX sms_events_sent_at_idx ON public.sms_events (sent_at DESC);
CREATE INDEX sms_events_location_idx ON public.sms_events USING GIST (location);

-- Enable Row Level Security
ALTER TABLE public.sms_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own SMS events" ON public.sms_events
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS events" ON public.sms_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create helper function to get SMS history
CREATE OR REPLACE FUNCTION get_sms_history(
    user_uuid uuid,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    contact_phone text,
    message text,
    status text,
    sent_at timestamptz,
    delivered_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.contact_name,
        se.contact_phone,
        se.message,
        se.status,
        se.sent_at,
        se.delivered_at
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
        AND se.sent_at > NOW() - (days_ago || ' days')::interval
    ORDER BY se.sent_at DESC;
END;
$$ LANGUAGE plpgsql;