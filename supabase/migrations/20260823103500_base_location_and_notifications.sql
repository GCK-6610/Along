-- 1. Add base location to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS base_location_name text,
ADD COLUMN IF NOT EXISTS base_latitude float8,
ADD COLUMN IF NOT EXISTS base_longitude float8;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL, -- e.g., 'join_request', 'plan_update', 'system'
    reference_id uuid, -- Optional reference to a plan or user
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
