create extension if not exists "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CHILD','PARENT','TEACHER','ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE age_group AS ENUM ('3_5','6_8','9_12');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subject_type AS ENUM ('PHYSICS','CHEMISTRY','MATH','LANGUAGE','CODING','OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('SCREEN_TIME','POTENTIAL_CYBERBULLYING','INAPPROPRIATE_CONTENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('LOW','MEDIUM','HIGH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE content_kind AS ENUM ('GAME','VIDEO','ARTICLE','CHAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role user_role not null,
  created_at timestamptz not null default now()
);

create table if not exists children (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  age int not null,
  age_group age_group not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists guardianship (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references users(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  relationship text not null,
  unique(parent_id, child_id)
);

create table if not exists games (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text not null,
  subject subject_type not null,
  min_age_group age_group not null,
  max_age_group age_group not null,
  estimated_duration_minutes int not null,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists gameplay_sessions (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  score int,
  completed boolean not null default false,
  metadata jsonb
);

create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  description text not null,
  points int not null
);

create table if not exists child_achievements (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique(child_id, achievement_id)
);

create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  alert_type alert_type not null,
  severity alert_severity not null,
  message text not null,
  generated_at timestamptz not null default now(),
  resolved boolean not null default false,
  resolved_at timestamptz
);

create table if not exists content_events (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  content_type content_kind not null,
  reference_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  raw_text text,
  labels text[]
);

create table if not exists creations (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  type text not null check (type in ('STORY', 'DRAWING', 'CODE')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_creations_child_id on creations(child_id);
create index if not exists idx_creations_created_at on creations(created_at desc);

-- Helper function to reference current profile id
create or replace function app_current_user_id()
returns uuid language sql stable as $$
  select id from users where auth_user_id = auth.uid();
$$;

-- Function to automatically create user profile when auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role user_role;
  user_full_name text;
  user_id_val uuid;
  child_age int;
  child_age_group age_group;
  child_display_name text;
begin
  -- Extract role from user_metadata, default to CHILD if not set or invalid
  if new.raw_user_meta_data->>'role' in ('CHILD', 'PARENT', 'TEACHER', 'ADMIN') then
    user_role := (new.raw_user_meta_data->>'role')::user_role;
  else
    user_role := 'CHILD';
  end if;

  -- Extract full_name from user_metadata, fallback to email or 'New User'
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.email,
    'New User'
  );

  -- Insert into users table
  insert into public.users (auth_user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    user_full_name,
    user_role
  )
  on conflict (auth_user_id) do nothing
  returning id into user_id_val;

  -- Auto-create child profile for CHILD users
  if user_role = 'CHILD' and user_id_val is not null then
    -- Check if child profile already exists
    if not exists (select 1 from children where user_id = user_id_val) then
      -- Extract age and age_group from user_metadata, or use defaults
      child_age := coalesce(
        (new.raw_user_meta_data->>'age')::int,
        6
      );
      
      -- Extract age_group or calculate from age
      if new.raw_user_meta_data->>'age_group' is not null then
        child_age_group := (new.raw_user_meta_data->>'age_group')::age_group;
      elsif child_age between 3 and 5 then
        child_age_group := '3_5';
      elsif child_age between 6 and 8 then
        child_age_group := '6_8';
      elsif child_age between 9 and 12 then
        child_age_group := '9_12';
      else
        child_age_group := '6_8'; -- default
      end if;

      child_display_name := coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1),
        'Player'
      );

      -- Insert child profile
      insert into public.children (user_id, display_name, age, age_group)
      values (user_id_val, child_display_name, child_age, child_age_group);
    end if;
  end if;

  return new;
end;
$$;

-- Trigger to automatically create user profile on sign-up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table users enable row level security;
alter table children enable row level security;
alter table guardianship enable row level security;
alter table games enable row level security;
alter table gameplay_sessions enable row level security;
alter table achievements enable row level security;
alter table child_achievements enable row level security;
alter table alerts enable row level security;
alter table content_events enable row level security;
alter table creations enable row level security;

-- Users policies
drop policy if exists "users self read" on users;
create policy "users self read" on users for select using (
  auth.uid() = auth_user_id or
  exists(select 1 from users u where u.auth_user_id = auth.uid() and u.role in ('TEACHER','ADMIN'))
);

drop policy if exists "users self update" on users;
create policy "users self update" on users for update using (auth.uid() = auth_user_id);

-- Note: The handle_new_user() trigger function uses SECURITY DEFINER, so it bypasses RLS
-- and can insert into users table automatically when auth.users row is created

-- Children policies
drop policy if exists "children read" on children;
create policy "children read" on children for select using (
  exists(select 1 from users u where u.id = children.user_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = children.id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

-- Guardianship policies
drop policy if exists "guardianship read" on guardianship;
create policy "guardianship read" on guardianship for select using (
  exists(select 1 from users u where u.id = guardianship.parent_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role = 'ADMIN')
);

-- Games policies (public read, staff manage)
drop policy if exists "games read" on games;
create policy "games read" on games for select using (true);
drop policy if exists "games manage" on games;
create policy "games manage" on games for insert with check (
  exists(select 1 from users u where u.auth_user_id = auth.uid() and u.role in ('TEACHER','ADMIN'))
);

-- Sessions policies
drop policy if exists "sessions read" on gameplay_sessions;
create policy "sessions read" on gameplay_sessions for select using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "sessions insert" on gameplay_sessions;
create policy "sessions insert" on gameplay_sessions for insert with check (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "sessions update" on gameplay_sessions;
create policy "sessions update" on gameplay_sessions for update using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = gameplay_sessions.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

-- Achievements policies
drop policy if exists "achievements read" on achievements;
create policy "achievements read" on achievements for select using (true);
drop policy if exists "child achievements read" on child_achievements;
create policy "child achievements read" on child_achievements for select using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = child_achievements.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = child_achievements.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "child achievements insert" on child_achievements;
create policy "child achievements insert" on child_achievements for insert with check (
  exists(select 1 from users u where u.auth_user_id = auth.uid() and u.role in ('TEACHER','ADMIN'))
);

-- Alerts policies
drop policy if exists "alerts read" on alerts;
create policy "alerts read" on alerts for select using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = alerts.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = alerts.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "alerts update" on alerts;
create policy "alerts update" on alerts for update using (
  exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = alerts.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "alerts insert" on alerts;
create policy "alerts insert" on alerts for insert with check (
  exists(select 1 from users u where u.auth_user_id = auth.uid() and u.role in ('TEACHER','ADMIN'))
);

-- Content events policies
drop policy if exists "content events read" on content_events;
create policy "content events read" on content_events for select using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "content events insert" on content_events;
create policy "content events insert" on content_events for insert with check (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

drop policy if exists "content events update" on content_events;
create policy "content events update" on content_events for update using (
  exists(select 1 from children c join users u on u.id = c.user_id where c.id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from guardianship g join users u on u.id = g.parent_id where g.child_id = content_events.child_id and u.auth_user_id = auth.uid())
  or exists(select 1 from users u2 where u2.auth_user_id = auth.uid() and u2.role in ('TEACHER','ADMIN'))
);

-- Creations policies (FR-06: Creative Learning Space)
drop policy if exists "children can view own creations" on creations;
create policy "children can view own creations" on creations for select using (
  child_id in (select id from children where user_id = auth.uid()::text::uuid)
);

drop policy if exists "children can create own creations" on creations;
create policy "children can create own creations" on creations for insert with check (
  child_id in (select id from children where user_id = auth.uid()::text::uuid)
);

drop policy if exists "children can update own creations" on creations;
create policy "children can update own creations" on creations for update using (
  child_id in (select id from children where user_id = auth.uid()::text::uuid)
);

drop policy if exists "children can delete own creations" on creations;
create policy "children can delete own creations" on creations for delete using (
  child_id in (select id from children where user_id = auth.uid()::text::uuid)
);

drop policy if exists "parents can view children creations" on creations;
create policy "parents can view children creations" on creations for select using (
  child_id in (
    select child_id from guardianship
    where parent_id in (select id from users where auth_user_id = auth.uid())
  )
);

drop policy if exists "teachers and admins can view all creations" on creations;
create policy "teachers and admins can view all creations" on creations for select using (
  exists (
    select 1 from users
    where auth_user_id = auth.uid()
    and role in ('TEACHER', 'ADMIN')
  )
);

-- Seed data
insert into achievements (id, code, name, description, points)
values
  (uuid_generate_v4(), 'FIRST_PLAY', 'First Steps', 'Completed the very first game session.', 50),
  (uuid_generate_v4(), 'HIGH_SCORE', 'Brain Spark', 'Scored 80 or higher in a session.', 80),
  (uuid_generate_v4(), 'FOCUS_HERO', 'Focus Hero', 'Finished five sessions this week.', 120)
ON CONFLICT (code) DO NOTHING;

insert into games (id, title, slug, description, subject, min_age_group, max_age_group, estimated_duration_minutes, created_by)
values
  (uuid_generate_v4(), 'Galaxy Math Quest', 'galaxy-math-quest', 'Solve friendly space math riddles.', 'MATH', '3_5', '9_12', 10, null),
  (uuid_generate_v4(), 'Kind Words Garden', 'kind-words-garden', 'Grow a vocabulary garden with positive words.', 'LANGUAGE', '6_8', '9_12', 8, null),
  (uuid_generate_v4(), 'Mini Physics Lab', 'mini-physics-lab', 'Explore gravity with simple experiments.', 'PHYSICS', '6_8', '9_12', 15, null)
ON CONFLICT (slug) DO NOTHING;
