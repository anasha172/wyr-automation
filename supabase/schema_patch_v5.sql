-- PostDeck — Team + Manager assignment patch (v5)
-- Run this in the Supabase SQL Editor after schema_patch_v4.sql
-- ─────────────────────────────────────────────────────────────

-- 1. Teams reference table
CREATE TABLE IF NOT EXISTS teams (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Extend user_profiles
--    team_id    → set by admin on managers; publishers derive team from their manager
--    manager_id → set by admin on publishers; links publisher to a manager
--    slack_user_id → admin-managed Slack user ID for managers
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS team_id      uuid REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manager_id   uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS slack_user_id text;

-- 3. RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may read teams (needed for dropdowns)
CREATE POLICY "read_teams" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins may insert / update / delete teams
CREATE POLICY "admin_manage_teams" ON teams
  FOR ALL
  USING      (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Replace campaigns RLS so managers see ONLY their assigned publishers' campaigns
--    (was: any manager sees all campaigns)
DROP POLICY IF EXISTS "publisher_own_campaigns" ON campaigns;

CREATE POLICY "publisher_own_campaigns" ON campaigns
  FOR ALL
  USING (
    -- Publisher sees own campaigns
    auth.uid() = user_id

    OR
    -- Admin sees everything
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')

    OR
    -- Manager sees campaigns belonging to publishers assigned to them
    EXISTS (
      SELECT 1 FROM user_profiles pub
      WHERE pub.id        = campaigns.user_id
        AND pub.manager_id = auth.uid()
    )
  );

-- 5. Same scoping for wyr_ideas
DROP POLICY IF EXISTS "ideas_via_campaign" ON wyr_ideas;

CREATE POLICY "ideas_via_campaign" ON wyr_ideas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
          OR EXISTS (
            SELECT 1 FROM user_profiles pub
            WHERE pub.id = c.user_id AND pub.manager_id = auth.uid()
          )
        )
    )
  );

-- 6. Same scoping for wyr_images
DROP POLICY IF EXISTS "images_via_campaign" ON wyr_images;

CREATE POLICY "images_via_campaign" ON wyr_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
          OR EXISTS (
            SELECT 1 FROM user_profiles pub
            WHERE pub.id = c.user_id AND pub.manager_id = auth.uid()
          )
        )
    )
  );

-- 7. Same scoping for approval_tokens
DROP POLICY IF EXISTS "tokens_via_campaign" ON approval_tokens;

CREATE POLICY "tokens_via_campaign" ON approval_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
        AND (
          c.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
          OR EXISTS (
            SELECT 1 FROM user_profiles pub
            WHERE pub.id = c.user_id AND pub.manager_id = auth.uid()
          )
        )
    )
  );
