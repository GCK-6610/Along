-- Migration: Profile Integrity Guards (Gender Lock & Verification Revocation on Name Change)
-- Enforces data integrity:
-- 1. Gender cannot be changed once established.
-- 2. If a verified user changes full_name, is_verified is automatically revoked to prevent identity spoofing.

CREATE OR REPLACE FUNCTION public.guard_profile_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Guard Gender: Once set, gender cannot be modified
  IF OLD.gender IS NOT NULL AND NEW.gender IS DISTINCT FROM OLD.gender THEN
    RAISE EXCEPTION 'Gender cannot be modified after initial account setup to protect community safety.';
  END IF;

  -- 2. Guard Verification: If user is verified and changes full_name, revoke verified badge
  IF OLD.is_verified = TRUE AND NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    NEW.is_verified := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_integrity_guard ON public.profiles;

CREATE TRIGGER trg_profiles_integrity_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_integrity();
