/*
  # Emergency Contacts System

  1. New Table
    - `emergency_contacts`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Reference to auth.users
      - `contact_name` (text) - Name of emergency contact
      - `contact_phone` (text) - Phone number
      - `contact_type` (text) - Relationship type
      - `priority` (integer) - Contact priority order
      - `custom_message` (text) - Custom emergency message
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `active` (boolean) - Contact status
    
  2. Security
    - Enable RLS
    - Users can only access their own contacts
    - Strict phone number validation
    
  3. Changes
    - Added contact relationship type
    - Added priority system
    - Added custom message field
    - Added active status
    - Added phone number validation
*/

-- Create emergency_contacts table with enhanced features
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

    -- Add constraints
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_phone CHECK (
        contact_phone ~ '^[+]?[0-9\s-()]{10,}$'
    ),
    CONSTRAINT valid_contact_type CHECK (
        contact_type = ANY (ARRAY[
            'family',
            'friend',
            'lawyer',
            'medical',
            'other'
        ])
    )
);

-- Create indexes
CREATE INDEX emergency_contacts_user_id_idx ON public.emergency_contacts (user_id);
CREATE INDEX emergency_contacts_priority_idx ON public.emergency_contacts (priority);

-- Enable Row Level Security
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own contacts" ON public.emergency_contacts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON public.emergency_contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON public.emergency_contacts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON public.emergency_contacts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_emergency_contacts_updated_at
    BEFORE UPDATE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create helper function to get user's emergency contacts
CREATE OR REPLACE FUNCTION get_user_emergency_contacts(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    contact_name text,
    contact_phone text,
    contact_type text,
    priority integer,
    custom_message text,
    active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.contact_name,
        ec.contact_phone,
        ec.contact_type,
        ec.priority,
        ec.custom_message,
        ec.active
    FROM emergency_contacts ec
    WHERE 
        ec.user_id = user_uuid
        AND ec.active = true
    ORDER BY 
        ec.priority ASC,
        ec.created_at ASC;
END;
$$ LANGUAGE plpgsql;