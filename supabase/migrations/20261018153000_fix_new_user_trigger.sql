-- Update handle_new_user() trigger to not insert placeholder 'New User' or 'unspecified'
-- New signups via SMS OTP will have NULL full_name and NULL gender until they complete onboarding.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, gender, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;
