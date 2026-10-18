-- Migration: Account Deletion RPC, Reports Table, and In-App Notification Triggers

-- 1. Account Deletion RPC (Apple App Store Guideline 5.1.1(v) Compliance)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (cascades to profiles, plans, participants, messages)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- 2. UGC Moderation & Safety: Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- 3. Automatic In-App Notification Trigger for Join Requests and Approvals
CREATE OR REPLACE FUNCTION public.handle_plan_participant_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  v_plan_title TEXT;
  v_requester_name TEXT;
BEGIN
  -- Case 1: New Join Request for Host
  IF TG_OP = 'INSERT' AND NEW.join_status = 'pending' THEN
    SELECT host_id, title INTO v_host_id, v_plan_title
    FROM public.plans WHERE id = NEW.plan_id;

    SELECT full_name INTO v_requester_name
    FROM public.profiles WHERE id = NEW.user_id;

    IF v_host_id IS NOT NULL AND v_host_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      VALUES (
        v_host_id,
        'New Join Request 🚀',
        COALESCE(v_requester_name, 'A member') || ' requested to join "' || COALESCE(v_plan_title, 'your hangout') || '"',
        'join_request',
        NEW.plan_id
      );
    END IF;
  END IF;

  -- Case 2: Join Request Status Updated for Attendee
  IF TG_OP = 'UPDATE' AND OLD.join_status = 'pending' THEN
    SELECT title INTO v_plan_title
    FROM public.plans WHERE id = NEW.plan_id;

    IF NEW.join_status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      VALUES (
        NEW.user_id,
        'Request Approved! 🎉',
        'You were approved to tag along for "' || COALESCE(v_plan_title, 'your hangout') || '"! The group chat is now open.',
        'join_approved',
        NEW.plan_id
      );
    ELSIF NEW.join_status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id)
      VALUES (
        NEW.user_id,
        'Hangout Request Update',
        'Your request to join "' || COALESCE(v_plan_title, 'the hangout') || '" was not accepted this time.',
        'join_rejected',
        NEW.plan_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plan_participant_notification ON public.plan_participants;
CREATE TRIGGER trg_plan_participant_notification
AFTER INSERT OR UPDATE OF join_status ON public.plan_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_plan_participant_notification();
