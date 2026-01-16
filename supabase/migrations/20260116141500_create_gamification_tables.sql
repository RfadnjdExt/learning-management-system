-- Up Migration
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- Note: references public.users(id) assumes a public users table exists which maps to auth.users
-- If not, we should reference auth.users(id) directly, but usually in Supabase we have a public profile table.
-- Earlier `page.tsx` showed `supabase.from("users").select("role")`, so `public.users` exists.

-- Enable RLS
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- Policies
create policy "Badges are viewable by everyone" on public.badges
  for select using (true);

create policy "Authenticated users can view all earned badges" on public.user_badges
  for select to authenticated using (true);

-- Indexes
create index if not exists user_badges_user_id_idx on public.user_badges(user_id);
