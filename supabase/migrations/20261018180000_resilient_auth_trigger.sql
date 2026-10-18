-- Migration: Make profiles.full_name nullable for initial auth user creation
-- and make handle_new_user() defensively resilient against trigger errors.

-- 1. Drop NOT NULL on full_name so pending auth users can be created before completing onboarding
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- 2. Update handle_new_user() with defensive error shielding and phone synchronization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    phone,
    full_name,
    gender,
    avatar_url,
    dob,
    privacy_settings
  )
  VALUES (
    new.id,
    new.phone,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.raw_user_meta_data->>'dob' IS NOT NULL AND new.raw_user_meta_data->>'dob' != '' 
      THEN (new.raw_user_meta_data->>'dob')::date 
      ELSE NULL 
    END,
    COALESCE(
      (new.raw_user_meta_data->>'privacy_settings')::jsonb, 
      '{"show_stats": true, "show_ratings": true, "show_location": true, "show_bio": true}'::jsonb
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent auxiliary trigger failures from blocking core authentication or OTP delivery
    RAISE WARNING 'handle_new_user encountered an exception: %', SQLERRM;
    RETURN new;
END;
$$;
