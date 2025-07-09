-- Create helper functions for SMS management

-- Create function to get SMS history
CREATE OR REPLACE FUNCTION get_sms_history(
    user_uuid uuid,
    days_ago integer DEFAULT 30,
    status_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    contact_phone text,
    message text,
    status text,
    sent_at timestamptz,
    delivered_at timestamptz,
    location_lat double precision,
    location_lng double precision
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
        se.delivered_at,
        ST_Y(se.location::geometry) as lat,
        ST_X(se.location::geometry) as lng
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
        AND se.sent_at > NOW() - (days_ago || ' days')::interval
        AND (status_filter IS NULL OR se.status = status_filter)
    ORDER BY se.sent_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get SMS statistics
CREATE OR REPLACE FUNCTION get_sms_stats(
    user_uuid uuid,
    days_ago integer DEFAULT 30
)
RETURNS TABLE (
    total_sent bigint,
    total_delivered bigint,
    total_failed bigint,
    average_delivery_time interval
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_sent,
        COUNT(*) FILTER (WHERE status = 'delivered')::bigint as total_delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint as total_failed,
        AVG(delivered_at - sent_at) FILTER (WHERE delivered_at IS NOT NULL) as average_delivery_time
    FROM sms_events
    WHERE 
        user_id = user_uuid
        AND sent_at > NOW() - (days_ago || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark SMS as delivered
CREATE OR REPLACE FUNCTION mark_sms_delivered(
    sms_id uuid,
    delivery_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    UPDATE sms_events
    SET 
        status = 'delivered',
        delivered_at = now(),
        metadata = metadata || delivery_metadata
    WHERE id = sms_id
    AND status = 'sent';
END;
$$ LANGUAGE plpgsql;

-- Create function to handle SMS failure
CREATE OR REPLACE FUNCTION handle_sms_failure(
    sms_id uuid,
    error_message text,
    failure_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    UPDATE sms_events
    SET 
        status = 'failed',
        metadata = metadata || jsonb_build_object(
            'error_message', error_message,
            'failed_at', now()
        ) || failure_metadata
    WHERE id = sms_id
    AND status IN ('pending', 'sent');
END;
$$ LANGUAGE plpgsql;

-- Create function to get emergency alerts sent
CREATE OR REPLACE FUNCTION get_emergency_alerts_sent(
    user_uuid uuid,
    hours_ago integer DEFAULT 24
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    sent_at timestamptz,
    status text,
    location_lat double precision,
    location_lng double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id,
        se.contact_name,
        se.sent_at,
        se.status,
        ST_Y(se.location::geometry) as lat,
        ST_X(se.location::geometry) as lng
    FROM sms_events se
    WHERE 
        se.user_id = user_uuid
        AND se.sent_at > NOW() - (hours_ago || ' hours')::interval
        AND se.metadata->>'type' = 'emergency_alert'
    ORDER BY se.sent_at DESC;
END;
$$ LANGUAGE plpgsql;