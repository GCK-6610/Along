-- Migration: Wipe all test user accounts, plans, chats, and activity while preserving venues
-- This resets the database for a clean, fresh start.

BEGIN;

-- 1. Wipe hangout activity, messages, and social connections
DELETE FROM public.chat_messages WHERE true;
DELETE FROM public.plan_participants WHERE true;
DELETE FROM public.ratings WHERE true;
DELETE FROM public.venue_ratings WHERE true;
DELETE FROM public.reports WHERE true;
DELETE FROM public.blocks WHERE true;
DELETE FROM public.notifications WHERE true;
DELETE FROM public.plans WHERE true;

-- 2. Wipe test user profiles and auth accounts
DELETE FROM public.profiles WHERE true;
DELETE FROM auth.users WHERE true;

-- 3. Install admin-callable reset RPC for future one-click resets
CREATE OR REPLACE FUNCTION public.wipe_all_test_user_data(admin_secret TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF admin_secret = 'along2026' THEN
        DELETE FROM public.chat_messages WHERE true;
        DELETE FROM public.plan_participants WHERE true;
        DELETE FROM public.ratings WHERE true;
        DELETE FROM public.venue_ratings WHERE true;
        DELETE FROM public.reports WHERE true;
        DELETE FROM public.blocks WHERE true;
        DELETE FROM public.notifications WHERE true;
        DELETE FROM public.plans WHERE true;
        DELETE FROM public.profiles WHERE true;
        DELETE FROM auth.users WHERE true;

        RETURN jsonb_build_object('success', true, 'message', 'All user accounts and test activity cleared. Venues intact.');
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wipe_all_test_user_data(TEXT) TO anon, authenticated;

COMMIT;

-- Preserved Tables (Untouched):
-- public.sponsored_hotspots (All curated venues & popular spots)
-- public.venue_partner_applications (Partner listings)
