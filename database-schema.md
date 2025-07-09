# DESIST! App - Database Schema Documentation

## Overview

The DESIST! app uses Supabase with PostgreSQL and PostGIS extensions for its database needs. This document outlines the complete database schema, including tables, relationships, constraints, and security policies.

## Core Tables

### 1. incidents

Stores information about reported incidents.

```sql
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  location geography(Point,4326) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'false_alarm'))
);

-- Indexes
CREATE INDEX incidents_location_idx ON incidents USING GIST (location);
```

### 2. emergency_contacts

Stores user emergency contacts.

```sql
CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_type text DEFAULT 'other' NOT NULL,
  priority integer DEFAULT 1 NOT NULL,
  custom_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  active boolean DEFAULT true NOT NULL,

  CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
  CONSTRAINT valid_phone CHECK (contact_phone ~ '^[+]?[0-9\s-()]{10,}$'),
  CONSTRAINT valid_contact_type CHECK (contact_type = ANY (ARRAY['family', 'friend', 'lawyer', 'medical', 'other']))
);

-- Indexes
CREATE INDEX emergency_contacts_user_id_idx ON public.emergency_contacts (user_id);
CREATE INDEX emergency_contacts_priority_idx ON public.emergency_contacts (priority);
CREATE INDEX emergency_contacts_type_idx ON public.emergency_contacts (contact_type);
CREATE INDEX emergency_contacts_active_idx ON public.emergency_contacts (active);
```

### 3. user_settings

Stores user preferences and settings.

```sql
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  stealth_mode_enabled boolean DEFAULT false NOT NULL,
  cover_story_screen text DEFAULT 'notes_app_style' NOT NULL,
  panic_gesture_type text DEFAULT 'triple_power_press' NOT NULL,
  auto_upload_enabled boolean DEFAULT true NOT NULL,
  auto_wipe_after_upload boolean DEFAULT false NOT NULL,
  emergency_sms_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  successful_invite_count integer DEFAULT 0 NOT NULL,
  badge_shield_builder boolean DEFAULT false NOT NULL,
  badge_founding_protector boolean DEFAULT false NOT NULL,
  badge_emergency_sentinel boolean DEFAULT false NOT NULL,
  badge_evidence_guardian boolean DEFAULT false NOT NULL,
  badge_community_defender boolean DEFAULT false NOT NULL,

  CONSTRAINT valid_cover_story_screen CHECK (cover_story_screen = ANY (ARRAY['notes_app_style', 'calculator_app', 'weather_app', 'calendar_app'])),
  CONSTRAINT valid_panic_gesture CHECK (panic_gesture_type = ANY (ARRAY['triple_power_press', 'volume_sequence', 'shake_device', 'triple_tap', 'custom_gesture'])),
  CONSTRAINT check_invite_count_positive CHECK (successful_invite_count >= 0),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Indexes
CREATE INDEX user_settings_user_id_idx ON public.user_settings (user_id);
```

### 4. incident_recordings

Stores video recordings of incidents.

```sql
CREATE TABLE public.incident_recordings (
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
```

### 5. incident_comments

Stores comments on incident recordings.

```sql
CREATE TABLE public.incident_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid REFERENCES incident_recordings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6. panic_events

Stores panic button activations and related data.

```sql
CREATE TABLE public.panic_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  triggered_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  location geography(Point,4326) NOT NULL,
  media_urls text[] DEFAULT '{}' NOT NULL,
  emergency_alerts_sent jsonb DEFAULT '{}' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_status CHECK (status = ANY (ARRAY['active', 'resolved', 'false_alarm', 'incomplete'])),
  CONSTRAINT valid_resolution CHECK (((status = 'active' AND resolved_at IS NULL) OR (status <> 'active' AND resolved_at IS NOT NULL))),
  CONSTRAINT valid_media_urls CHECK (array_length(media_urls, 1) <= 10)
);

-- Indexes
CREATE INDEX panic_events_location_idx ON public.panic_events USING gist (location);
CREATE INDEX panic_events_user_id_idx ON public.panic_events (user_id);
CREATE INDEX panic_events_status_idx ON public.panic_events (status);
CREATE INDEX panic_events_triggered_at_idx ON public.panic_events (triggered_at DESC);
```

### 7. badge_events

Tracks badge awards.

```sql
CREATE TABLE public.badge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  badge_name text NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  version integer DEFAULT 1 NOT NULL
);

-- Indexes
CREATE INDEX idx_badge_events_user_version ON badge_events(user_id, version DESC);
```

### 8. badge_requirements

Defines requirements for earning badges.

```sql
CREATE TABLE public.badge_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### 9. trust_metrics

Stores trust scores and verification metrics.

```sql
CREATE TABLE public.trust_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_encounters integer DEFAULT 0 NOT NULL,
  total_verified integer DEFAULT 0 NOT NULL,
  total_flagged integer DEFAULT 0 NOT NULL,
  trust_score numeric(5,2) DEFAULT 0.00 NOT NULL,
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT valid_encounters CHECK (total_encounters >= 0),
  CONSTRAINT valid_verified CHECK (total_verified >= 0),
  CONSTRAINT valid_flagged CHECK (total_flagged >= 0),
  CONSTRAINT valid_trust_score CHECK (trust_score >= 0.00 AND trust_score <= 100.00),
  CONSTRAINT verified_less_than_total CHECK (total_verified <= total_encounters),
  CONSTRAINT flagged_less_than_total CHECK (total_flagged <= total_encounters)
);

-- Indexes
CREATE INDEX trust_metrics_score_idx ON public.trust_metrics (trust_score DESC);
CREATE INDEX trust_metrics_last_updated_idx ON public.trust_metrics (last_updated DESC);
```

### 10. media_uploads

Tracks media upload status.

```sql
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

  CONSTRAINT valid_upload_status CHECK (upload_status = ANY (ARRAY['pending', 'uploading', 'completed', 'failed'])),
  CONSTRAINT valid_processing_status CHECK (processing_status = ANY (ARRAY['pending', 'processing', 'completed', 'failed'])),
  CONSTRAINT valid_file_type CHECK (file_type = ANY (ARRAY['video/mp4', 'image/jpeg', 'image/png', 'audio/mp3', 'audio/wav']))
);

-- Indexes
CREATE INDEX media_uploads_user_id_idx ON public.media_uploads (user_id);
CREATE INDEX media_uploads_status_idx ON public.media_uploads (upload_status, processing_status);
CREATE INDEX media_uploads_related_record_idx ON public.media_uploads (related_record_id);
```

### 11. sms_events

Tracks emergency SMS messages.

```sql
CREATE TABLE public.sms_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  message text NOT NULL,
  location geography(Point,4326),
  status text DEFAULT 'pending' NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  delivered_at timestamptz,
  metadata jsonb DEFAULT '{}',

  CONSTRAINT valid_status CHECK (status = ANY (ARRAY['pending', 'sent', 'delivered', 'failed'])),
  CONSTRAINT valid_phone CHECK (contact_phone ~ '^[+]?[0-9\s-()]{10,}$')
);

-- Indexes
CREATE INDEX sms_events_user_id_idx ON public.sms_events (user_id);
CREATE INDEX sms_events_status_idx ON public.sms_events (status);
CREATE INDEX sms_events_sent_at_idx ON public.sms_events (sent_at DESC);
CREATE INDEX sms_events_location_idx ON public.sms_events USING gist (location);
```

### 12. settings_audit_log

Tracks all settings changes for security.

```sql
CREATE TABLE public.settings_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  setting_changed text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz DEFAULT now() NOT NULL,
  platform text NOT NULL,
  ip_address text,
  user_agent text
);

-- Indexes
CREATE INDEX settings_audit_log_user_id_idx ON public.settings_audit_log (user_id);
CREATE INDEX settings_audit_log_changed_at_idx ON public.settings_audit_log (changed_at DESC);
```

## Views

### 1. user_badges_summary

Aggregates badge information for each user.

```sql
CREATE OR REPLACE VIEW user_badges_summary AS
SELECT 
  id,
  (
    CASE WHEN badge_founding_protector THEN 1 ELSE 0 END +
    CASE WHEN badge_shield_builder THEN 1 ELSE 0 END +
    CASE WHEN badge_emergency_sentinel THEN 1 ELSE 0 END +
    CASE WHEN badge_evidence_guardian THEN 1 ELSE 0 END +
    CASE WHEN badge_community_defender THEN 1 ELSE 0 END
  ) as total_badges,
  successful_invite_count,
  badge_founding_protector,
  badge_shield_builder,
  badge_emergency_sentinel,
  badge_evidence_guardian,
  badge_community_defender,
  created_at
FROM user_settings;
```

### 2. badge_leaderboard

Ranks users by badge count.

```sql
CREATE OR REPLACE VIEW badge_leaderboard AS
SELECT 
  u.id,
  u.email,
  s.total_badges,
  s.successful_invite_count,
  ROW_NUMBER() OVER (ORDER BY s.total_badges DESC, s.successful_invite_count DESC) as rank
FROM auth.users u
JOIN user_badges_summary s ON u.id = s.id
WHERE u.confirmed_at IS NOT NULL;
```

## Functions

### 1. find_nearby_incidents

Finds incidents within a specified radius.

```sql
CREATE OR REPLACE FUNCTION find_nearby_incidents(
  lat double precision,
  lng double precision,
  radius_meters double precision DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  type text,
  description text,
  distance double precision,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.type,
    i.description,
    ST_Distance(
      i.location::geography,
      ST_MakePoint(lng, lat)::geography
    ) as distance,
    i.created_at
  FROM incidents i
  WHERE 
    ST_DWithin(
      i.location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_meters
    )
    AND i.status = 'active'
    AND i.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;
```

### 2. update_trust_score

Updates trust metrics based on verification and flags.

```sql
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
```

### 3. check_badges_on_action

Checks and awards badges based on user actions.

```sql
CREATE OR REPLACE FUNCTION check_badges_on_action()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_emergency_sentinel_badge(NEW.user_id);
  PERFORM check_evidence_guardian_badge(NEW.user_id);
  PERFORM check_community_defender_badge(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. log_settings_change

Logs settings changes for security audit.

```sql
CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
DECLARE
  setting_name text := TG_ARGV[0];
  old_val jsonb;
  new_val jsonb;
BEGIN
  -- Extract the specific setting value that changed
  CASE setting_name
    WHEN 'stealth_mode' THEN
      old_val := jsonb_build_object('enabled', OLD.stealth_mode_enabled);
      new_val := jsonb_build_object('enabled', NEW.stealth_mode_enabled);
    -- Other cases...
  END CASE;

  -- Insert audit log entry
  INSERT INTO public.settings_audit_log (
    user_id,
    setting_changed,
    old_value,
    new_value,
    platform,
    ip_address,
    user_agent
  ) VALUES (
    OLD.user_id,
    setting_name,
    old_val,
    new_val,
    current_setting('app.platform', true),
    current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS) Policies

### incidents Table

```sql
-- Anyone can read incidents
CREATE POLICY "Anyone can read incidents"
  ON incidents
  FOR SELECT
  USING (true);

-- Authenticated users can create incidents
CREATE POLICY "Authenticated users can create incidents"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own incidents
CREATE POLICY "Users can update their own incidents"
  ON incidents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

### emergency_contacts Table

```sql
-- Users can view own contacts
CREATE POLICY "Users can view own contacts"
  ON emergency_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own contacts
CREATE POLICY "Users can insert own contacts"
  ON emergency_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own contacts
CREATE POLICY "Users can update own contacts"
  ON emergency_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own contacts
CREATE POLICY "Users can delete own contacts"
  ON emergency_contacts
  FOR DELETE
  USING (auth.uid() = user_id);
```

### user_settings Table

```sql
-- Users can view own settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update own settings
CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## Triggers

### 1. Update Timestamps

```sql
-- Update updated_at column on update
CREATE TRIGGER update_updated_at_column
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Badge Checks

```sql
-- Check for badge eligibility on incident verification
CREATE TRIGGER check_badges_incidents
  AFTER INSERT OR UPDATE OF status ON incidents
  FOR EACH ROW
  WHEN (NEW.status = 'verified')
  EXECUTE FUNCTION check_badges_on_action();

-- Check for badge eligibility on recording publication
CREATE TRIGGER check_badges_recordings
  AFTER INSERT OR UPDATE OF status ON incident_recordings
  FOR EACH ROW
  WHEN (NEW.status = 'public')
  EXECUTE FUNCTION check_badges_on_action();

-- Check for badge eligibility on comment creation
CREATE TRIGGER check_badges_comments
  AFTER INSERT ON incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION check_badges_on_action();
```

### 3. Settings Audit

```sql
-- Audit stealth mode changes
CREATE TRIGGER audit_stealth_mode
  AFTER UPDATE OF stealth_mode_enabled ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_settings_change('stealth_mode');

-- Audit cover story changes
CREATE TRIGGER audit_cover_story
  AFTER UPDATE OF cover_story_screen ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_settings_change('cover_story');
```

## PostGIS Integration

The database uses PostGIS for location-based features:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Example of a spatial query function
CREATE OR REPLACE FUNCTION find_nearby_incidents(
  lat double precision,
  lng double precision,
  radius_meters double precision DEFAULT 5000
)
RETURNS TABLE (
  id uuid,
  type text,
  description text,
  distance double precision,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.type,
    i.description,
    ST_Distance(
      i.location::geography,
      ST_MakePoint(lng, lat)::geography
    ) as distance,
    i.created_at
  FROM incidents i
  WHERE 
    ST_DWithin(
      i.location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_meters
    )
    AND i.status = 'active'
    AND i.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;
```

## Security Considerations

1. **Row Level Security**: All tables have RLS policies to restrict access
2. **Data Validation**: Constraints ensure data integrity
3. **Audit Logging**: Changes to sensitive settings are logged
4. **Spatial Security**: Location data is protected with RLS
5. **Permission Checks**: Functions validate user permissions

## Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Spatial Indexes**: GiST indexes for efficient spatial queries
3. **Denormalization**: Strategic denormalization for performance
4. **Query Optimization**: Optimized functions for common queries
5. **Connection Pooling**: Efficient database connection management