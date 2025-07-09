/*
  # Safe Cover Story Events Constraint Update

  1. Changes
    - Update the valid_action constraint on cover_story_events table
    - Add new action types: 'auto_timeout' and 'long_press_exit'
    - Safely drop and recreate the constraint
    
  2. Purpose
    - Allow tracking of different exit methods from stealth mode
    - Distinguish between automatic timeouts and manual exits
    - Improve analytics on stealth mode usage patterns
*/

DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_action'
      AND table_name = 'cover_story_events'
  ) THEN
    ALTER TABLE cover_story_events DROP CONSTRAINT valid_action;
  END IF;

  -- Create the constraint safely
  ALTER TABLE cover_story_events
  ADD CONSTRAINT valid_action CHECK (action IN ('activated', 'deactivated', 'auto_timeout', 'long_press_exit'));

END $$;