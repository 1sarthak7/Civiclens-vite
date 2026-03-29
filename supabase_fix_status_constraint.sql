-- ═══════════════════════════════════════════════════════════
-- CivicLens — Fix: Add 'Rejected' to status CHECK constraint
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Step 1: Find and drop the existing CHECK constraint on status
-- (The constraint name varies — this finds it dynamically)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'complaints'::regclass
    AND att.attname = 'status'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE complaints DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No CHECK constraint found on status column';
  END IF;
END $$;

-- Step 2: Add new constraint that includes 'Rejected'
ALTER TABLE complaints
  ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('Pending', 'In Progress', 'Awaiting Confirmation', 'Resolved', 'Rejected'));

-- ═══════════════════════════════════════════════════════════
-- DONE! The reject feature should now work.
-- ═══════════════════════════════════════════════════════════
