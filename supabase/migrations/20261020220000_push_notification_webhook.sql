-- Migration: Chat Messages and Notification Indexes + Remote Push Dispatcher Trigger

-- 1. Index on chat_messages for high-speed plan message retrieval and unread scans
CREATE INDEX IF NOT EXISTS idx_chat_messages_plan_created 
ON public.chat_messages (plan_id, created_at DESC);

-- 2. Index on notifications for rapid recipient retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC);

-- 3. Push Notification Webhook Trigger (Documentation & Optional Hook)
-- In Supabase Cloud Dashboard:
-- Database -> Webhooks -> Add new webhook:
-- Name: send-push-on-notification-insert
-- Table: public.notifications
-- Events: INSERT
-- Type: Supabase Edge Functions -> "send-push-notification"
-- HTTP Method: POST
