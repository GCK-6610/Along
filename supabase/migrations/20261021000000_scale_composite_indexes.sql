-- High-concurrency composite indexes for Along scaling
-- Optimizes chat messages, plan participants, notifications, and rating lookups

-- 1. Chat Messages: accelerate message history retrieval and unread count queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_plan_created 
ON public.chat_messages (plan_id, created_at DESC);

-- 2. Plan Participants: optimize "My Plans" queries (joined, hosted, requested)
CREATE INDEX IF NOT EXISTS idx_plan_participants_user_status 
ON public.plan_participants (user_id, join_status);

-- 3. Plan Participants: optimize attendee roster rendering and capacity counts per plan
CREATE INDEX IF NOT EXISTS idx_plan_participants_plan_status 
ON public.plan_participants (plan_id, join_status);

-- 4. Notifications: accelerate unread badge counter and notifications feed
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, created_at DESC);

-- 5. Ratings: eliminate sequential scans when checking whether user already rated host
CREATE INDEX IF NOT EXISTS idx_ratings_plan_rater 
ON public.ratings (plan_id, rater_id);

-- 6. Venue Ratings: eliminate sequential scans when checking venue review status by user
CREATE INDEX IF NOT EXISTS idx_venue_ratings_user_id 
ON public.venue_ratings (user_id);
