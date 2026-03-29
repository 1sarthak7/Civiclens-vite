-- ═══════════════════════════════════════════════════════════
-- CivicLens — Upvote/Downvote & Duplicate Marking Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════

-- 1. Add new columns to complaints table
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES complaints(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Create the complaint_votes table
CREATE TABLE IF NOT EXISTS complaint_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(complaint_id, user_id)
);

-- 3. Enable RLS on complaint_votes
ALTER TABLE complaint_votes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for complaint_votes

-- Anyone authenticated can read votes (needed for displaying counts)
CREATE POLICY "Anyone can read votes"
  ON complaint_votes FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes"
  ON complaint_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON complaint_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON complaint_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Index for fast vote lookups
CREATE INDEX IF NOT EXISTS idx_complaint_votes_complaint_id 
  ON complaint_votes(complaint_id);

CREATE INDEX IF NOT EXISTS idx_complaint_votes_user_id 
  ON complaint_votes(user_id);

-- ═══════════════════════════════════════════════════════════
-- DONE! You can now close this and deploy the frontend.
-- ═══════════════════════════════════════════════════════════
