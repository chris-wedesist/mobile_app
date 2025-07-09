/*
  # Emergency Contacts System Update

  1. Updates
    - Add new indexes for better performance
    - Add helper functions for contact management
    - Update existing constraints
    
  2. Changes
    - Add IF NOT EXISTS checks
    - Update indexes
    - Add new utility functions
*/

-- Add new indexes if they don't exist
CREATE INDEX IF NOT EXISTS emergency_contacts_type_idx ON public.emergency_contacts (contact_type);
CREATE INDEX IF NOT EXISTS emergency_contacts_active_idx ON public.emergency_contacts (active);

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS get_user_emergency_contacts;
DROP FUNCTION IF EXISTS get_primary_emergency_contact;

-- Create helper function to get user's emergency contacts
CREATE OR REPLACE FUNCTION get_user_emergency_contacts(
    user_uuid uuid,
    include_inactive boolean DEFAULT false
)
RETURNS TABLE (
    id uuid,
    contact_name text,
    contact_phone text,
    contact_type text,
    priority integer,
    custom_message text,
    active boolean,
    created_at timestamptz
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
        ec.active,
        ec.created_at
    FROM emergency_contacts ec
    WHERE 
        ec.user_id = user_uuid
        AND (include_inactive OR ec.active = true)
    ORDER BY 
        ec.priority ASC,
        ec.contact_type ASC,
        ec.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get primary emergency contact
CREATE OR REPLACE FUNCTION get_primary_emergency_contact(user_uuid uuid)
RETURNS TABLE (
    contact_name text,
    contact_phone text,
    custom_message text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.contact_name,
        ec.contact_phone,
        ec.custom_message
    FROM emergency_contacts ec
    WHERE 
        ec.user_id = user_uuid
        AND ec.active = true
    ORDER BY 
        ec.priority ASC,
        ec.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Update constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_priority') THEN
        ALTER TABLE emergency_contacts ADD CONSTRAINT valid_priority 
        CHECK (priority >= 1 AND priority <= 5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_phone') THEN
        ALTER TABLE emergency_contacts ADD CONSTRAINT valid_phone 
        CHECK (contact_phone ~ '^[+]?[0-9\s-()]{10,}$');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_contact_type') THEN
        ALTER TABLE emergency_contacts ADD CONSTRAINT valid_contact_type 
        CHECK (contact_type = ANY (ARRAY['family', 'friend', 'lawyer', 'medical', 'other']));
    END IF;
END $$;