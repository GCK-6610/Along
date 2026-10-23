-- Migration: Chat Message Rate Limiting
-- Prevents message flood attacks and bot spamming (max 5 messages per 3 seconds per user)

CREATE OR REPLACE FUNCTION public.check_chat_message_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count messages sent by this user in the last 3 seconds
  SELECT COUNT(*) INTO recent_count
  FROM public.chat_messages
  WHERE user_id = NEW.user_id
    AND created_at > (now() - INTERVAL '3 seconds');

  -- Disallow more than 5 messages per 3 seconds
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You are sending messages too quickly. Please wait a moment.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_chat_message_rate_limit ON public.chat_messages;
CREATE TRIGGER trg_check_chat_message_rate_limit
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_chat_message_rate_limit();
