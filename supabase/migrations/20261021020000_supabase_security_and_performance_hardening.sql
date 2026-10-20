-- Migration: Comprehensive Supabase Security & Performance Hardening
-- Resolves Supabase Security Advisor and Database Linter advisories:
-- 1. Enables RLS on spatial_ref_sys
-- 2. Removes permissive open UPDATE policy on public.plans
-- 3. Hardens search_path on functions to prevent search-path hijacking
-- 4. Revokes public execute on internal trigger functions and tightens RPC permissions
-- 5. Converts auth.uid() to (select auth.uid()) to activate cached Auth RLS initPlans
-- 6. Indexes all unindexed foreign keys to prevent sequential scans during cascading deletes

-- ============================================================================
-- 1. SPATIAL REFERENCE SYSTEM RLS
-- ============================================================================
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read-only access to spatial_ref_sys" ON public.spatial_ref_sys;
CREATE POLICY "Allow read-only access to spatial_ref_sys"
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);

-- ============================================================================
-- 2. CLOSE OPEN UPDATE POLICY ON PLANS
-- ============================================================================
-- Dropping permissive policy that previously allowed arbitrary updates to plans
DROP POLICY IF EXISTS "Allow admin archive plan status" ON public.plans;

-- ============================================================================
-- 3. FUNCTION SEARCH PATH HARDENING (Prevent schema hijacking)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_profile_rating') THEN
    ALTER FUNCTION public.update_profile_rating() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_integrity') THEN
    ALTER FUNCTION public.guard_profile_integrity() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_hotspot_along_rating') THEN
    ALTER FUNCTION public.update_hotspot_along_rating() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_plan_location') THEN
    ALTER FUNCTION public.sync_plan_location() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_profile_dob') THEN
    ALTER FUNCTION public.validate_profile_dob() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_plan_participant_notification') THEN
    ALTER FUNCTION public.handle_plan_participant_notification() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_account') THEN
    ALTER FUNCTION public.delete_user_account() SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'remove_participant') THEN
    ALTER FUNCTION public.remove_participant(uuid, uuid) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'leave_plan') THEN
    ALTER FUNCTION public.leave_plan(uuid) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_plan_completed') THEN
    ALTER FUNCTION public.mark_plan_completed(uuid) SET search_path = public, pg_temp;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_plan_completed_and_attendance') THEN
    ALTER FUNCTION public.mark_plan_completed_and_attendance(uuid, uuid, uuid[], uuid[]) SET search_path = public, pg_temp;
  END IF;
END $$;

-- ============================================================================
-- 4. FUNCTION EXECUTE PERMISSIONS (Revoke public access to triggers)
-- ============================================================================
-- Triggers are executed by Postgres internally and should not be invoked via REST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_integrity') THEN
    REVOKE EXECUTE ON FUNCTION public.guard_profile_integrity() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_plan_participant_notification') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_plan_participant_notification() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_hotspot_along_rating') THEN
    REVOKE EXECUTE ON FUNCTION public.update_hotspot_along_rating() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_profile_dob') THEN
    REVOKE EXECUTE ON FUNCTION public.validate_profile_dob() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_plan_location') THEN
    REVOKE EXECUTE ON FUNCTION public.sync_plan_location() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_profile_rating') THEN
    REVOKE EXECUTE ON FUNCTION public.update_profile_rating() FROM PUBLIC, anon, authenticated;
  END IF;

  -- Client-callable action RPCs: require authenticated session, revoke from anon and public
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user_account') THEN
    REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'leave_plan') THEN
    REVOKE EXECUTE ON FUNCTION public.leave_plan(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.leave_plan(uuid) TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_plan_completed') THEN
    REVOKE EXECUTE ON FUNCTION public.mark_plan_completed(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.mark_plan_completed(uuid) TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'remove_participant') THEN
    REVOKE EXECUTE ON FUNCTION public.remove_participant(uuid, uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.remove_participant(uuid, uuid) TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_plan_completed_and_attendance') THEN
    REVOKE EXECUTE ON FUNCTION public.mark_plan_completed_and_attendance(uuid, uuid, uuid[], uuid[]) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.mark_plan_completed_and_attendance(uuid, uuid, uuid[], uuid[]) TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 5. AUTH RLS INITPLAN OPTIMIZATION ((select auth.uid()))
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- Plans
DROP POLICY IF EXISTS "Authenticated users can create plans." ON public.plans;
CREATE POLICY "Authenticated users can create plans." 
  ON public.plans FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Hosts can update their own plans." ON public.plans;
CREATE POLICY "Hosts can update their own plans." 
  ON public.plans FOR UPDATE USING ((select auth.uid()) = host_id);

DROP POLICY IF EXISTS "Hosts can delete their own plans." ON public.plans;
CREATE POLICY "Hosts can delete their own plans." 
  ON public.plans FOR DELETE USING ((select auth.uid()) = host_id);

-- Plan Participants
DROP POLICY IF EXISTS "Users can leave plans." ON public.plan_participants;
CREATE POLICY "Users can leave plans." 
  ON public.plan_participants FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can join plans as pending" ON public.plan_participants;
DROP POLICY IF EXISTS "Users can join plans." ON public.plan_participants;
CREATE POLICY "Users can join plans as pending" 
  ON public.plan_participants FOR INSERT 
  WITH CHECK (
    (select auth.uid()) = user_id 
    AND (
      join_status = 'pending' 
      OR 
      EXISTS (
        SELECT 1 FROM public.plans 
        WHERE plans.id = plan_participants.plan_id 
          AND plans.host_id = (select auth.uid())
      )
    )
  );

-- Chat Messages
DROP POLICY IF EXISTS "Users can read chat if they are host or approved participant" ON public.chat_messages;
CREATE POLICY "Users can read chat if they are host or approved participant"
ON public.chat_messages
FOR SELECT
USING (
  (select auth.role()) = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM public.plans p 
      WHERE p.id = chat_messages.plan_id AND p.host_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.plan_participants pp
      WHERE pp.plan_id = chat_messages.plan_id 
        AND pp.user_id = (select auth.uid()) 
        AND pp.join_status = 'approved'
    )
  )
);

DROP POLICY IF EXISTS "Users can insert chat if they are host or approved participant" ON public.chat_messages;
CREATE POLICY "Users can insert chat if they are host or approved participant"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  (select auth.uid()) = user_id AND
  (
    EXISTS (
      SELECT 1 FROM public.plans p 
      WHERE p.id = plan_id AND p.host_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.plan_participants pp
      WHERE pp.plan_id = plan_id 
        AND pp.user_id = (select auth.uid()) 
        AND pp.join_status = 'approved'
    )
  )
);

-- Ratings
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
CREATE POLICY "Users can insert their own ratings" 
  ON public.ratings FOR INSERT 
  WITH CHECK ((select auth.uid()) = rater_id);

-- Venue Ratings
DROP POLICY IF EXISTS "Users can insert their own venue ratings" ON public.venue_ratings;
CREATE POLICY "Users can insert their own venue ratings"
  ON public.venue_ratings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Reports
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING ((select auth.uid()) = reporter_id);

-- ============================================================================
-- 6. UNINDEXED FOREIGN KEYS (Accelerate joins and cascading deletes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_plan_id ON public.chat_messages(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_participants_user_id ON public.plan_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_host_id ON public.plans(host_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON public.ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_plan_id ON public.ratings(plan_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_plan_id ON public.reports(plan_id);
CREATE INDEX IF NOT EXISTS idx_venue_ratings_user_id ON public.venue_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
