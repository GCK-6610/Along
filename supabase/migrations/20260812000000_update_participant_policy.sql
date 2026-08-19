-- Allow the host of a plan to update participant records (e.g., changing status to approved/rejected)
CREATE POLICY "Host can update participant status"
  ON public.plan_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.plans 
      WHERE plans.id = plan_participants.plan_id 
      AND plans.host_id = auth.uid()
    )
  );
