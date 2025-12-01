-- Auto-create user profiles trigger
-- This trigger automatically creates a user profile in the users table
-- when a new user signs up via Supabase Auth

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

-- Note: This trigger runs automatically when a new user signs up.
-- The function uses SECURITY DEFINER, so it bypasses RLS and can insert into the users table.

