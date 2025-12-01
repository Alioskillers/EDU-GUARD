-- Create enums if they don't exist
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

-- Create alerts table
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

-- Create index for faster queries
create index if not exists idx_alerts_child_id on alerts(child_id);
create index if not exists idx_alerts_resolved on alerts(resolved);
create index if not exists idx_alerts_generated_at on alerts(generated_at desc);

-- Enable Row Level Security
alter table alerts enable row level security;

-- RLS Policies for alerts
-- Children can view their own alerts
drop policy if exists "children can view own alerts" on alerts;
create policy "children can view own alerts" on alerts
  for select using (
    exists (
      select 1 from children c
      join users u on u.id = c.user_id
      where c.id = alerts.child_id
      and u.auth_user_id = auth.uid()
    )
  );

-- Parents can view alerts for their children
drop policy if exists "parents can view children alerts" on alerts;
create policy "parents can view children alerts" on alerts
  for select using (
    exists (
      select 1 from children c
      join guardianship g on g.child_id = c.id
      join users u on u.id = g.parent_id
      where c.id = alerts.child_id
      and u.auth_user_id = auth.uid()
    )
  );

-- Teachers and Admins can view all alerts
drop policy if exists "teachers and admins can view all alerts" on alerts;
create policy "teachers and admins can view all alerts" on alerts
  for select using (
    exists (
      select 1 from users
      where auth_user_id = auth.uid()
      and role in ('TEACHER', 'ADMIN')
    )
  );

-- Parents, Teachers, and Admins can resolve alerts
drop policy if exists "parents teachers admins can resolve alerts" on alerts;
create policy "parents teachers admins can resolve alerts" on alerts
  for update using (
    exists (
      select 1 from users
      where auth_user_id = auth.uid()
      and role in ('PARENT', 'TEACHER', 'ADMIN')
    )
  );

-- System can insert alerts (via service role or triggers)
drop policy if exists "system can insert alerts" on alerts;
create policy "system can insert alerts" on alerts
  for insert with check (true);

