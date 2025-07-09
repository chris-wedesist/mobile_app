/*
  # Drop Constraint Utility Function

  1. New Function
    - `drop_constraint_if_exists`: Safely drops a constraint if it exists
    
  2. Purpose
    - Simplify constraint management in migrations
    - Prevent errors when dropping non-existent constraints
    - Make migrations more maintainable
    
  3. Usage
    - Call with table name and constraint name
    - Works with any constraint type (CHECK, FOREIGN KEY, UNIQUE, etc.)
*/

CREATE OR REPLACE FUNCTION public.drop_constraint_if_exists(
    target_table TEXT,
    target_constraint TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = target_constraint
      AND table_name = target_table
  ) THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', target_table, target_constraint);
  END IF;
END;
$$;

-- Example usage:
-- SELECT drop_constraint_if_exists('cover_story_events', 'valid_action');