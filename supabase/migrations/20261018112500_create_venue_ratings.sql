-- Create venue_ratings table for crowd-sourced Along venue scores
CREATE TABLE IF NOT EXISTS public.venue_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_name TEXT NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plan_id, user_id)
);

-- Enable RLS
ALTER TABLE public.venue_ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view venue ratings
DROP POLICY IF EXISTS "Anyone can view venue ratings" ON public.venue_ratings;
CREATE POLICY "Anyone can view venue ratings"
    ON public.venue_ratings FOR SELECT
    USING (true);

-- Allow authenticated users to insert their own venue ratings
DROP POLICY IF EXISTS "Users can insert their own venue ratings" ON public.venue_ratings;
CREATE POLICY "Users can insert their own venue ratings"
    ON public.venue_ratings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Add along_rating_count to sponsored_hotspots if not present
ALTER TABLE public.sponsored_hotspots
ADD COLUMN IF NOT EXISTS along_rating_count INT DEFAULT 0;

-- Function to auto-recalculate sponsored_hotspots.along_rating
CREATE OR REPLACE FUNCTION public.update_hotspot_along_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_hotspot_id UUID;
    v_avg NUMERIC(3, 1);
    v_count INT;
BEGIN
    -- Match hotspot by name similarity or substring
    SELECT id INTO v_hotspot_id 
    FROM public.sponsored_hotspots 
    WHERE NEW.venue_name ILIKE '%' || name || '%' OR name ILIKE '%' || NEW.venue_name || '%'
    LIMIT 1;

    IF v_hotspot_id IS NOT NULL THEN
        SELECT 
            ROUND(AVG(score)::numeric, 1),
            COUNT(*)
        INTO v_avg, v_count
        FROM public.venue_ratings vr
        JOIN public.sponsored_hotspots sh ON (vr.venue_name ILIKE '%' || sh.name || '%' OR sh.name ILIKE '%' || vr.venue_name || '%')
        WHERE sh.id = v_hotspot_id;

        IF v_avg IS NOT NULL THEN
            UPDATE public.sponsored_hotspots
            SET along_rating = v_avg,
                along_rating_count = v_count
            WHERE id = v_hotspot_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_venue_rating_inserted ON public.venue_ratings;
CREATE TRIGGER on_venue_rating_inserted
    AFTER INSERT OR UPDATE ON public.venue_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_hotspot_along_rating();
