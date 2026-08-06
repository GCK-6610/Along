-- ==========================================
-- ALONG APP: SUPABASE DATABASE SCHEMA
-- ==========================================

-- CLEAR EXISTING TABLES (Useful for development/reset)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.plan_participants CASCADE;
DROP TABLE IF EXISTS public.sponsored_hotspots CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable pgvector extension for ML recommendations
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  phone TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. PLANS TABLE
CREATE TABLE public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  capacity INTEGER NOT NULL DEFAULT 4,
  gender_reach TEXT DEFAULT 'all',
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone." 
  ON public.plans FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create plans." 
  ON public.plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Hosts can update their own plans." 
  ON public.plans FOR UPDATE USING (auth.uid() = host_id);

-- 3. PLAN PARTICIPANTS (Join Table)
CREATE TABLE public.plan_participants (
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  join_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  intro_message TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (plan_id, user_id)
);

ALTER TABLE public.plan_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone." 
  ON public.plan_participants FOR SELECT USING (true);

CREATE POLICY "Users can join plans." 
  ON public.plan_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave plans." 
  ON public.plan_participants FOR DELETE USING (auth.uid() = user_id);


-- 4. CHAT MESSAGES TABLE
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Note: A stricter policy would check if the user is a participant. 
-- For MVP, allowing authenticated users to read/write if they have the plan_id.
CREATE POLICY "Authenticated users can read messages." 
  ON public.chat_messages FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages." 
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. SPONSORED HOTSPOTS TABLE
CREATE TABLE public.sponsored_hotspots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sponsored_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active hotspots are viewable by everyone." 
  ON public.sponsored_hotspots FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admin only inserts (For MVP, using Supabase Studio directly bypasses RLS)


-- ==========================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ==========================================
-- Allow clients to listen to chat_messages inserts
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ==========================================
-- POSTGRES FUNCTIONS (ML RECOMMENDATION)
-- ==========================================
CREATE OR REPLACE FUNCTION match_plans (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_lat float,
  user_lon float
)
RETURNS TABLE (
  id uuid,
  host_id uuid,
  title text,
  venue text,
  tags text[],
  capacity integer,
  gender_reach text,
  status text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone,
  similarity float,
  distance_km float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    plans.id,
    plans.host_id,
    plans.title,
    plans.venue,
    plans.tags,
    plans.capacity,
    plans.gender_reach,
    plans.status,
    plans.latitude,
    plans.longitude,
    plans.created_at,
    1 - (plans.embedding <=> query_embedding) AS similarity,
    -- Simple Haversine approximation for MVP distance in km
    (6371 * acos(cos(radians(user_lat)) * cos(radians(plans.latitude)) * cos(radians(plans.longitude) - radians(user_lon)) + sin(radians(user_lat)) * sin(radians(plans.latitude)))) AS distance_km
  FROM plans
  WHERE 1 - (plans.embedding <=> query_embedding) > match_threshold
    AND plans.status = 'active'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
