-- Up Migration

-- Add verses_count to evaluations
alter table public.evaluations 
add column if not exists verses_count integer default 0;

-- Add enable_leaderboard to classes
alter table public.classes 
add column if not exists enable_leaderboard boolean default true;
