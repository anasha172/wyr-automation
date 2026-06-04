-- WYR Automation — Supabase Schema

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  theme text not null,
  tone text not null default 'fun',
  audience text not null default 'general',
  stage text not null default 'ideas_pending',
  created_at timestamptz not null default now()
);

create table if not exists wyr_ideas (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  option_a text not null,
  option_b text not null,
  approval_status text not null default 'pending',
  manager_comment text,
  created_at timestamptz not null default now()
);

create table if not exists wyr_images (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  idea_id uuid references wyr_ideas(id) on delete set null,
  option text not null check (option in ('a', 'b')),
  image_url text not null,
  thumbnail_url text,
  source text not null default 'google',
  approval_status text not null default 'pending',
  is_manager_pick boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists approval_tokens (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  token uuid not null unique default gen_random_uuid(),
  approval_type text not null check (approval_type in ('ideas', 'images')),
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null unique,
  canva_design_id text,
  final_image_url text,
  instagram_media_id text,
  instagram_post_url text,
  posted_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  google_api_key text,
  google_search_engine_id text,
  pinterest_api_token text,
  manager_email text,
  canva_template_id text,
  canva_access_token text,
  instagram_user_id text,
  instagram_access_token text,
  updated_at timestamptz not null default now()
);

-- Realtime
alter publication supabase_realtime add table wyr_ideas;
alter publication supabase_realtime add table wyr_images;
alter publication supabase_realtime add table campaigns;

-- Storage bucket for designs
insert into storage.buckets (id, name, public) values ('wyr-designs', 'wyr-designs', true)
  on conflict do nothing;
