-- Table for storing children's creative works (stories, drawings, code)
create table if not exists creations (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  title text not null,
  type text not null check (type in ('STORY', 'DRAWING', 'CODE')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster queries
create index if not exists idx_creations_child_id on creations(child_id);
create index if not exists idx_creations_created_at on creations(created_at desc);

-- RLS Policies for creations
alter table creations enable row level security;

-- Children can view and manage their own creations
drop policy if exists "children can view own creations" on creations;
create policy "children can view own creations" on creations
  for select using (
    child_id in (select id from children where user_id = auth.uid()::text::uuid)
  );

drop policy if exists "children can create own creations" on creations;
create policy "children can create own creations" on creations
  for insert with check (
    child_id in (select id from children where user_id = auth.uid()::text::uuid)
  );

drop policy if exists "children can update own creations" on creations;
create policy "children can update own creations" on creations
  for update using (
    child_id in (select id from children where user_id = auth.uid()::text::uuid)
  );

drop policy if exists "children can delete own creations" on creations;
create policy "children can delete own creations" on creations
  for delete using (
    child_id in (select id from children where user_id = auth.uid()::text::uuid)
  );

-- Parents can view their children's creations
drop policy if exists "parents can view children creations" on creations;
create policy "parents can view children creations" on creations
  for select using (
    child_id in (
      select child_id from guardianship
      where parent_id in (select id from users where auth_user_id = auth.uid())
    )
  );

-- Teachers and admins can view all creations (for educational purposes)
drop policy if exists "teachers and admins can view all creations" on creations;
create policy "teachers and admins can view all creations" on creations
  for select using (
    exists (
      select 1 from users
      where auth_user_id = auth.uid()
      and role in ('TEACHER', 'ADMIN')
    )
  );

