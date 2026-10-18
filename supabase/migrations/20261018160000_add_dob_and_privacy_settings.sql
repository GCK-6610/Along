-- Add dob and privacy_settings to public.profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dob DATE NULL,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_stats": true, "show_ratings": true, "show_location": true, "show_bio": true}'::jsonb;

-- Trigger to enforce 18+ requirement at database level whenever dob is provided
CREATE OR REPLACE FUNCTION public.validate_profile_dob()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.dob IS NOT NULL AND NEW.dob > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'User must be at least 18 years old to join Along.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_dob ON public.profiles;
CREATE TRIGGER trg_validate_profile_dob
BEFORE INSERT OR UPDATE OF dob ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_dob();

-- Update handle_new_user() trigger to support dob and privacy_settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, gender, avatar_url, dob, privacy_settings)
  VALUES (
    new.id,
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
  );
  RETURN new;
END;
$$;
