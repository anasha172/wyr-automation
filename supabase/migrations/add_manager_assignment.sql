-- ─── Manager assignment migration ────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor

-- Ideas: who was this idea assigned to for approval?
ALTER TABLE wyr_ideas ADD COLUMN IF NOT EXISTS assigned_manager_id uuid;

-- Ideas: who was the composed story assigned to for approval?
ALTER TABLE wyr_ideas ADD COLUMN IF NOT EXISTS story_assigned_manager_id uuid;
ALTER TABLE wyr_ideas ADD COLUMN IF NOT EXISTS story_sent_to_manager boolean DEFAULT false;

-- Images: manager assignment for image approval
ALTER TABLE wyr_images ADD COLUMN IF NOT EXISTS assigned_manager_id uuid;
ALTER TABLE wyr_images ADD COLUMN IF NOT EXISTS sent_to_manager boolean DEFAULT false;

-- User settings: manager's Slack User ID for DMs
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS slack_user_id text;
