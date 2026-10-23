-- Migration: Wipe all test user accounts, plans, chats, and activity while preserving venues
-- This resets the database for a clean, fresh start.

BEGIN;

-- 1. Wipe hangout activity, messages, and social connections
DELETE FROM public.chat_messages;
DELETE FROM public.plan_participants;
DELETE FROM public.ratings;
DELETE FROM public.venue_ratings;
DELETE FROM public.reports;
DELETE FROM public.blocks;
DELETE FROM public.notifications;
DELETE FROM public.plans;

-- 2. Wipe test user profiles and auth accounts
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- 3. Install admin-callable reset RPC for future one-click resets
CREATE OR REPLACE FUNCTION public.wipe_all_test_user_data(admin_secret TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF admin_secret = 'along2026' THEN
        DELETE FROM public.chat_messages;
        DELETE FROM public.plan_participants;
        DELETE FROM public.ratings;
        DELETE FROM public.venue_ratings;
        DELETE FROM public.reports;
        DELETE FROM public.blocks;
        DELETE FROM public.notifications;
        DELETE FROM public.plans;
        DELETE FROM public.profiles;
        DELETE FROM auth.users;

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
