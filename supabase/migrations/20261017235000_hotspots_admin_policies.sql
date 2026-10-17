-- Policies for local admin portal hotspot management
DO $$
BEGIN
    DROP POLICY IF EXISTS "Active hotspots are viewable by everyone." ON public.sponsored_hotspots;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sponsored_hotspots' AND policyname = 'Allow all select for sponsored_hotspots'
    ) THEN
        CREATE POLICY "Allow all select for sponsored_hotspots"
        ON public.sponsored_hotspots
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sponsored_hotspots' AND policyname = 'Allow insert for sponsored_hotspots'
    ) THEN
        CREATE POLICY "Allow insert for sponsored_hotspots"
        ON public.sponsored_hotspots
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sponsored_hotspots' AND policyname = 'Allow update for sponsored_hotspots'
    ) THEN
        CREATE POLICY "Allow update for sponsored_hotspots"
        ON public.sponsored_hotspots
        FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sponsored_hotspots' AND policyname = 'Allow delete for sponsored_hotspots'
    ) THEN
        CREATE POLICY "Allow delete for sponsored_hotspots"
        ON public.sponsored_hotspots
        FOR DELETE
        TO anon, authenticated
        USING (true);
    END IF;

    -- Also allow updating plan status to completed for 10-day auto-archive cleanup
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plans' AND policyname = 'Allow admin archive plan status'
    ) THEN
        CREATE POLICY "Allow admin archive plan status"
        ON public.plans
        FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;
