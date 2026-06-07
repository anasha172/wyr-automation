-- WYR Automation — Ideas title + why_it_works patch (v4)
-- Run this in your Supabase SQL editor

ALTER TABLE wyr_ideas ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE wyr_ideas ADD COLUMN IF NOT EXISTS why_it_works TEXT;
