-- Run this in your Supabase SQL editor to support per-idea stories and carousel posting

ALTER TABLE wyr_ideas
  ADD COLUMN IF NOT EXISTS story_image_url TEXT,
  ADD COLUMN IF NOT EXISTS story_approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS story_rejection_comment TEXT;

-- Index for fast lookup of ideas needing story approval
CREATE INDEX IF NOT EXISTS idx_wyr_ideas_story_status ON wyr_ideas(campaign_id, story_approval_status);
