-- Migration: User Blocking Table, Indexes, RLS Policies, and Plan Participation Guard
-- Supports full Apple App Store Guideline 1.2 and Google Play Safety Compliance

-- 1. Create public.blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_blocker_blocked UNIQUE(blocker_id, blocked_id),
  CONSTRAINT check_not_self_block CHECK (blocker_id != blocked_id)
);

-- 2. Indexes for scalable fast lookups
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);

-- 3. Row-Level Security on public.blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
CREATE POLICY "Users can view own blocks"
  ON public.blocks FOR SELECT
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can insert own blocks" ON public.blocks;
CREATE POLICY "Users can insert own blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (
    (select auth.uid()) = blocker_id 
    AND blocker_id != blocked_id
  );

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.blocks;
CREATE POLICY "Users can delete own blocks"
  ON public.blocks FOR DELETE
  USING ((select auth.uid()) = blocker_id);

-- 4. Permissions
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
REVOKE ALL ON public.blocks FROM anon;

-- 5. Hardened plan join request policy to enforce two-way block prevention
DROP POLICY IF EXISTS "Users can join plans as pending" ON public.plan_participants;
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
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      JOIN public.plans p ON p.id = plan_participants.plan_id
      WHERE (b.blocker_id = p.host_id AND b.blocked_id = (select auth.uid()))
         OR (b.blocker_id = (select auth.uid()) AND b.blocked_id = p.host_id)
    )
  );
