-- 1. Add secret location details to plans
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS secret_location_details text;

-- 2. Add attendance status to plan_participants
-- Values: 'pending' (default), 'attended', 'absent'
ALTER TABLE public.plan_participants 
ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT 'pending';

-- 3. Update profiles for stats caching
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating_avg float DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS events_hosted int DEFAULT 0,
ADD COLUMN IF NOT EXISTS events_attended int DEFAULT 0;

-- 4. Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE,
    rater_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ratee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    score int NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at timestamptz DEFAULT now(),
    -- Prevent duplicate ratings for the same plan from the same person to the same ratee
    UNIQUE(plan_id, rater_id, ratee_id)
);

-- RLS for ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings"
    ON public.ratings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
CREATE POLICY "Users can insert their own ratings"
    ON public.ratings FOR INSERT
    WITH CHECK (auth.uid() = rater_id);

-- 5. Trigger function to update profile aggregates on new rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        rating_count = (SELECT count(*) FROM public.ratings WHERE ratee_id = NEW.ratee_id),
        rating_avg = (SELECT avg(score) FROM public.ratings WHERE ratee_id = NEW.ratee_id)
    WHERE id = NEW.ratee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_rating_inserted ON public.ratings;
CREATE TRIGGER on_rating_inserted
    AFTER INSERT ON public.ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_rating();

-- 6. RPC Function for hosts to mark event completed and log attendance
-- This runs in a secure transaction and updates host/attendee stats
CREATE OR REPLACE FUNCTION mark_plan_completed_and_attendance(
    p_plan_id uuid,
    p_host_id uuid,
    p_attendees uuid[], 
    p_absentees uuid[]
)
RETURNS void AS $$
DECLARE
    v_host_id uuid;
BEGIN
    -- Verify plan ownership and status
    SELECT host_id INTO v_host_id FROM public.plans WHERE id = p_plan_id AND status = 'active';
    
    IF v_host_id IS NULL OR v_host_id != p_host_id THEN
        RAISE EXCEPTION 'Not authorized or plan already completed';
    END IF;

    -- Update attendees
    IF array_length(p_attendees, 1) > 0 THEN
        UPDATE public.plan_participants 
        SET attendance_status = 'attended'
        WHERE plan_id = p_plan_id AND user_id = ANY(p_attendees);
        
        -- Increment events_attended for attendees
        UPDATE public.profiles
        SET events_attended = events_attended + 1
        WHERE id = ANY(p_attendees);
    END IF;

    -- Update absentees
    IF array_length(p_absentees, 1) > 0 THEN
        UPDATE public.plan_participants 
        SET attendance_status = 'absent'
        WHERE plan_id = p_plan_id AND user_id = ANY(p_absentees);
    END IF;

    -- Update plan status
    UPDATE public.plans 
    SET status = 'completed'
    WHERE id = p_plan_id;

    -- Increment events_hosted for the host ONLY if at least one person attended
    -- If no one attended, it's considered a stale/archived event
    IF array_length(p_attendees, 1) > 0 THEN
        UPDATE public.profiles
        SET events_hosted = events_hosted + 1
        WHERE id = p_host_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
