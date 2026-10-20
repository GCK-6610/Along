-- Security hardening: lock down plan_participants join_status and add content length constraints

-- 1. Secure plan_participants INSERT policy:
-- Prevents malicious actors from submitting direct REST requests with join_status = 'approved'.
-- Only the host can insert with join_status = 'approved' when creating their plan.
-- All other users must insert with join_status = 'pending'.
DROP POLICY IF EXISTS "Users can join plans." ON public.plan_participants;
DROP POLICY IF EXISTS "Users can join plans as pending" ON public.plan_participants;

CREATE POLICY "Users can join plans as pending" 
ON public.plan_participants FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    join_status = 'pending' 
    OR 
    EXISTS (
      SELECT 1 FROM public.plans 
      WHERE plans.id = plan_participants.plan_id 
        AND plans.host_id = auth.uid()
    )
  )
);

-- 2. Add message length constraint to protect against spam and buffer bloat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_chat_message_length'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chk_chat_message_length 
    CHECK (length(trim(content)) > 0 AND length(content) <= 1000);
  END IF;
END $$;

-- 3. Add plan title length constraint to ensure descriptive, valid hangouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_plan_title_length'
  ) THEN
    ALTER TABLE public.plans
    ADD CONSTRAINT chk_plan_title_length
    CHECK (length(trim(title)) >= 3 AND length(title) <= 100);
  END IF;
END $$;
