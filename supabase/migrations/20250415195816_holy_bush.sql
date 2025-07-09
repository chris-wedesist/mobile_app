/*
  # Create incidents reporting system

  1. New Tables
    - `incidents`
      - `id` (uuid, primary key)
      - `type` (text) - Type of incident
      - `description` (text) - Detailed description
      - `location` (geography) - Location in PostGIS format
      - `user_id` (uuid) - Reference to auth.users
      - `status` (text) - Current status of incident
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Security
    - Enable RLS on incidents table
    - Add policies for:
      - Anyone can read incidents
      - Only authenticated users can create incidents
      - Only admins and incident creator can update incidents
*/

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  location geography(POINT, 4326) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'false_alarm'))
);

-- Create index for spatial queries
CREATE INDEX IF NOT EXISTS incidents_location_idx ON incidents USING GIST (location);

-- Enable Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read incidents"
  ON incidents
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create incidents"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incidents"
  ON incidents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to find incidents within radius
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