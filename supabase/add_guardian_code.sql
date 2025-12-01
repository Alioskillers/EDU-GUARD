-- Add guardian_code column to children table
alter table children add column if not exists guardian_code text unique;

-- Create index for faster lookups
create index if not exists idx_children_guardian_code on children(guardian_code);

-- Function to generate a unique 6-digit code
create or replace function generate_guardian_code() returns text as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    -- Generate a random 6-digit code (100000 to 999999)
    new_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    
    -- Check if code already exists
    select exists(select 1 from children where guardian_code = new_code) into code_exists;
    
    -- Exit loop if code is unique
    exit when not code_exists;
  end loop;
  
  return new_code;
end;
$$ language plpgsql;

-- Generate codes for existing children that don't have one
update children
set guardian_code = generate_guardian_code()
where guardian_code is null;

-- Make guardian_code required (not null) after generating codes
alter table children alter column guardian_code set not null;

-- Trigger to auto-generate guardian_code for new children
create or replace function set_guardian_code()
returns trigger as $$
begin
  if new.guardian_code is null then
    new.guardian_code := generate_guardian_code();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_guardian_code_trigger on children;
create trigger set_guardian_code_trigger
  before insert on children
  for each row
  execute function set_guardian_code();

