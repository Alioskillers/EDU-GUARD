-- Run this in Supabase SQL Editor to disable email confirmation requirement
-- This is useful for development/testing

-- Update auth settings to not require email confirmation
UPDATE auth.config 
SET enable_signup = true,
    enable_email_confirmations = false
WHERE id = 1;

-- Or if the above doesn't work, you can manually confirm users:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'alioskiller8@gmail.com';
