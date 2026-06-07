-- WYR Automation — Multi-user patch (v3)
-- Run this after schema.sql and schema_patch_v2.sql

-- 1. User profiles (role + display name)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'publisher' check (role in ('publisher', 'manager', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'publisher')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. RLS on campaigns
alter table campaigns enable row level security;

-- Publishers see only their own campaigns
create policy "publisher_own_campaigns" on campaigns
  for all
  using (
    auth.uid() = user_id
    or exists (
      select 1 from user_profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- 3. RLS on user_profiles
alter table user_profiles enable row level security;

-- Anyone authenticated can read profiles (needed for manager/admin views)
create policy "read_profiles" on user_profiles
  for select
  using (auth.uid() is not null);

-- Users can update their own profile; admins can update any
create policy "update_own_profile" on user_profiles
  for update
  using (
    auth.uid() = id
    or exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can insert/delete profiles directly
create policy "admin_manage_profiles" on user_profiles
  for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "admin_delete_profiles" on user_profiles
  for delete
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. RLS on user_settings — each user sees only their own row
alter table user_settings enable row level security;

create policy "own_settings" on user_settings
  for all
  using (auth.uid() = user_id);

-- 5. wyr_ideas / wyr_images / approval_tokens — inherit campaign access
alter table wyr_ideas enable row level security;
create policy "ideas_via_campaign" on wyr_ideas
  for all
  using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from user_profiles
            where id = auth.uid() and role in ('manager', 'admin')
          )
        )
    )
  );

alter table wyr_images enable row level security;
create policy "images_via_campaign" on wyr_images
  for all
  using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from user_profiles
            where id = auth.uid() and role in ('manager', 'admin')
          )
        )
    )
  );

-- approval_tokens are read by the approval page (public token check bypasses RLS via service role)
alter table approval_tokens enable row level security;
create policy "tokens_via_campaign" on approval_tokens
  for all
  using (
    exists (
      select 1 from campaigns c
      where c.id = campaign_id
        and (
          c.user_id = auth.uid()
          or exists (
            select 1 from user_profiles
            where id = auth.uid() and role in ('manager', 'admin')
          )
        )
    )
  );
