/*
  # Drop Index Utility Function

  1. New Function
    - `drop_index_if_exists`: Safely drops an index if it exists
    
  2. Purpose
    - Simplify index management in migrations
    - Prevent errors when dropping non-existent indexes
    - Make migrations more maintainable
    
  3. Usage
    - Call with index name
    - Works with any index type (btree, gist, gin, etc.)
*/

CREATE OR REPLACE FUNCTION public.drop_index_if_exists(
    target_index TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = target_index
  ) THEN
    EXECUTE format('DROP INDEX %I', target_index);
  END IF;
END;
$$;

-- Example usage:
-- SELECT drop_index_if_exists('incidents_location_idx');