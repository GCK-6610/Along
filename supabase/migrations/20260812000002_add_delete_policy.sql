CREATE POLICY "Hosts can delete their own plans." 
  ON public.plans FOR DELETE 
  USING (auth.uid() = host_id);
