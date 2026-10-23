-- Migration: Secure Admin RPCs for Moderation & Reports Console
DO $$
BEGIN
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken TEXT;
END $$;

-- 1. Secure RPC to fetch all user reports for the local admin console
CREATE OR REPLACE FUNCTION public.get_admin_reports(admin_secret TEXT)
RETURNS TABLE (
    id UUID,
    reporter_id UUID,
    reporter_name TEXT,
    reported_user_id UUID,
    reported_user_name TEXT,
    plan_id UUID,
    plan_title TEXT,
    reason TEXT,
    details TEXT,
    status TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF admin_secret = 'along2026' THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.reporter_id,
            COALESCE(rep.full_name, 'Member') AS reporter_name,
            r.reported_user_id,
            COALESCE(target.full_name, 'User') AS reported_user_name,
            r.plan_id,
            COALESCE(p.title, 'Hangout') AS plan_title,
            r.reason,
            r.details,
            COALESCE(r.status, 'pending') AS status,
            r.action_taken,
            r.created_at
        FROM public.reports r
        LEFT JOIN public.profiles rep ON rep.id = r.reporter_id
        LEFT JOIN public.profiles target ON target.id = r.reported_user_id
        LEFT JOIN public.plans p ON p.id = r.plan_id
        ORDER BY r.created_at DESC;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

-- 2. Secure RPC to update report status or take moderation action
CREATE OR REPLACE FUNCTION public.update_admin_report_status(
    admin_secret TEXT,
    target_report_id UUID,
    new_status TEXT,
    moderation_action TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reported_user_id UUID;
BEGIN
    IF admin_secret = 'along2026' THEN
        SELECT reported_user_id INTO v_reported_user_id 
        FROM public.reports 
        WHERE id = target_report_id;

        UPDATE public.reports
        SET status = new_status,
            action_taken = moderation_action
        WHERE id = target_report_id;

        -- If action is 'ban' or 'deactivate', remove verification badge from reported user
        IF moderation_action = 'ban' AND v_reported_user_id IS NOT NULL THEN
            UPDATE public.profiles
            SET is_verified = false
            WHERE id = v_reported_user_id;
        END IF;

        RETURN jsonb_build_object('success', true);
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

-- 3. Secure RPC to fetch active blocks count
CREATE OR REPLACE FUNCTION public.get_admin_blocks_count(admin_secret TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    IF admin_secret = 'along2026' THEN
        SELECT COUNT(*) INTO v_count FROM public.blocks;
        RETURN v_count;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Invalid admin secret';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_reports(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_report_status(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_blocks_count(TEXT) TO anon, authenticated;
