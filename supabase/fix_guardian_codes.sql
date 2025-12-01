-- Quick fix script to ensure guardian codes exist
-- Run this if guardian codes are not appearing

-- Step 1: Check if column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'children' AND column_name = 'guardian_code'
  ) THEN
    -- Add the column
    ALTER TABLE children ADD COLUMN guardian_code text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_children_guardian_code ON children(guardian_code);
    
    RAISE NOTICE 'Added guardian_code column';
  ELSE
    RAISE NOTICE 'guardian_code column already exists';
  END IF;
END $$;

-- Step 2: Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION generate_guardian_code() RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 6-digit code (100000 to 999999)
    new_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM children WHERE guardian_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Generate codes for all children that don't have one
UPDATE children
SET guardian_code = generate_guardian_code()
WHERE guardian_code IS NULL OR guardian_code = '';

-- Step 4: Make guardian_code required (not null) after generating codes
ALTER TABLE children ALTER COLUMN guardian_code SET NOT NULL;

-- Step 5: Create trigger to auto-generate for new children (if not exists)
CREATE OR REPLACE FUNCTION set_guardian_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.guardian_code IS NULL OR NEW.guardian_code = '' THEN
    NEW.guardian_code := generate_guardian_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_guardian_code_trigger ON children;
CREATE TRIGGER set_guardian_code_trigger
  BEFORE INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION set_guardian_code();

-- Step 6: Verify codes were generated
SELECT id, display_name, guardian_code, 
       CASE WHEN guardian_code IS NULL THEN 'MISSING' ELSE 'OK' END as status
FROM children
ORDER BY created_at DESC
LIMIT 10;

