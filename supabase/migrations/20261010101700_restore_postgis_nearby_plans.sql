-- Restore get_nearby_plans to use PostGIS ST_Distance while dropping conflicting legacy overloads

-- 1. Drop old overloaded signatures to prevent PGRST203 candidate function ambiguity
DROP FUNCTION IF EXISTS public.get_nearby_plans(vector, float, int, float, float);
DROP FUNCTION IF EXISTS public.get_nearby_plans(vector, float, int, float, float, text);
DROP FUNCTION IF EXISTS public.get_nearby_plans;

-- 2. Create the unified, PostGIS-enabled get_nearby_plans function
CREATE OR REPLACE FUNCTION public.get_nearby_plans (
  query_embedding vector(1536) DEFAULT NULL,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50,
  user_lat float DEFAULT NULL,
  user_lon float DEFAULT NULL,
  user_gender text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  host_id uuid,
  title text,
  venue text,
  tags text[],
  description text,
  capacity integer,
  gender_reach text,
  status text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone,
  scheduled_at timestamp with time zone,
  distance_km float,
  similarity float,
  host json,
  participants_list json
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_location geography(POINT);
BEGIN
  IF user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
    user_location := ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.host_id,
    p.title,
    p.venue,
    p.tags,
    p.description,
    p.capacity,
    p.gender_reach,
    p.status,
    p.latitude,
    p.longitude,
    p.created_at,
    p.scheduled_at,
    -- Distance using PostGIS ST_Distance (returns meters, convert to km)
    CASE 
      WHEN user_location IS NOT NULL AND p.location IS NOT NULL THEN
        (ST_Distance(p.location, user_location) / 1000.0)::float
      ELSE NULL
    END AS distance_km,
    -- Similarity
    CASE 
      WHEN query_embedding IS NOT NULL AND p.embedding IS NOT NULL THEN
        1 - (p.embedding <=> query_embedding)
      ELSE 0
    END AS similarity,
    -- Host JSON
    (
      SELECT row_to_json(prof)
      FROM public.profiles prof
      WHERE prof.id = p.host_id
    ) AS host,
    -- Participants JSON
    (
      SELECT json_agg(
        json_build_object(
          'id', pp.user_id,
          'join_status', pp.join_status,
          'intro_message', pp.intro_message,
          'full_name', participant_prof.full_name,
          'gender', participant_prof.gender,
          'avatar_url', participant_prof.avatar_url,
          'is_verified', participant_prof.is_verified,
          'profiles', (
            SELECT row_to_json(participant_prof)
          )
        )
      )
      FROM public.plan_participants pp
      LEFT JOIN public.profiles participant_prof ON participant_prof.id = pp.user_id
      WHERE pp.plan_id = p.id
    ) AS participants_list
  FROM public.plans p
  WHERE p.status = 'active'
    AND (
      p.gender_reach = 'all' 
      OR 
      (p.gender_reach = 'same' AND user_gender = (SELECT prof2.gender FROM public.profiles prof2 WHERE prof2.id = p.host_id))
      OR
      user_gender IS NULL
    )
    AND (
      query_embedding IS NULL 
      OR p.embedding IS NULL 
      OR (1 - (p.embedding <=> query_embedding) > match_threshold)
    )
    -- Optional Spatial Filter: Limit to a 50km radius to utilize GIST Index for extreme scaling!
    AND (
      user_location IS NULL 
      OR ST_DWithin(p.location, user_location, 50000) 
    )
  ORDER BY 
    CASE WHEN query_embedding IS NOT NULL THEN (p.embedding <=> query_embedding) ELSE 0 END ASC, -- HNSW optimizes ASC distance
    CASE WHEN user_location IS NOT NULL AND p.location IS NOT NULL THEN
      ST_Distance(p.location, user_location)
    ELSE 0 END ASC NULLS LAST,
    p.created_at DESC
  LIMIT match_count;
END;
$$;
