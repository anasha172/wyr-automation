-- PostDeck — LinkedIn posts history (v6)
-- Run in Supabase SQL Editor after schema_patch_v5.sql
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS linkedin_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  jobs        jsonb       NOT NULL DEFAULT '[]',  -- snapshot of jobs posted
  caption     text,
  post_url    text,
  target      text        NOT NULL DEFAULT 'personal',  -- 'personal' | 'company'
  slide_count int         NOT NULL DEFAULT 0,
  posted_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Publisher sees own posts
-- Manager sees posts from their assigned publishers
-- Admin sees all
CREATE POLICY "linkedin_posts_access" ON linkedin_posts
  FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM user_profiles pub
      WHERE pub.id        = linkedin_posts.user_id
        AND pub.manager_id = auth.uid()
    )
  );
