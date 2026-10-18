-- Migration: Clean up test user activity while keeping venues and hotspots intact
DELETE FROM public.notifications;
DELETE FROM public.ratings;
DELETE FROM public.chat_messages;
DELETE FROM public.plan_participants;
DELETE FROM public.plans;
DELETE FROM public.profiles;
