-- Lockdown venue_partner_applications so anonymous scrapers cannot read contact details
DO $$
BEGIN
    -- 1. Drop public SELECT and UPDATE policies on venue_partner_applications
    DROP POLICY IF EXISTS "Allow read for anon and authenticated" ON public.venue_partner_applications;
    DROP POLICY IF EXISTS "Allow update for anon and authenticated" ON public.venue_partner_applications;

    -- Ensure INSERT policy exists and allows public submissions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_partner_applications' AND policyname = 'Anyone can submit partner application'
    ) THEN
        CREATE POLICY "Anyone can submit partner application"
        ON public.venue_partner_applications
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- 2. Create a secure RPC for local admin console to read applications with passkey
CREATE OR REPLACE FUNCTION public.get_admin_partner_applications(admin_secret TEXT)
RETURNS SETOF public.venue_partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF admin_secret = 'along2026' THEN
        RETURN QUERY 
        SELECT * FROM public.venue_partner_applications 
        ORDER BY created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

-- 3. Create a secure RPC for local admin console to update status with passkey
CREATE OR REPLACE FUNCTION public.update_admin_partner_application_status(
    admin_secret TEXT,
    target_id UUID,
    new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF admin_secret = 'along2026' THEN
        UPDATE public.venue_partner_applications 
        SET status = new_status 
        WHERE id = target_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_partner_applications(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_partner_application_status(TEXT, UUID, TEXT) TO anon, authenticated;
