-- 1. Drop the old insecure policies
DROP POLICY IF EXISTS "Authenticated users can read messages." ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages." ON public.chat_messages;

-- 2. Create the strict read policy
CREATE POLICY "Users can read chat if they are host or approved participant"
ON public.chat_messages
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (
    EXISTS (
      SELECT 1 FROM public.plans p 
      WHERE p.id = chat_messages.plan_id AND p.host_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.plan_participants pp
      WHERE pp.plan_id = chat_messages.plan_id 
        AND pp.user_id = auth.uid() 
        AND pp.join_status = 'approved'
    )
  )
);

-- 3. Create the strict insert policy
CREATE POLICY "Users can insert chat if they are host or approved participant"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (
    EXISTS (
      SELECT 1 FROM public.plans p 
      WHERE p.id = plan_id AND p.host_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.plan_participants pp
      WHERE pp.plan_id = plan_id 
        AND pp.user_id = auth.uid() 
        AND pp.join_status = 'approved'
    )
  )
);
