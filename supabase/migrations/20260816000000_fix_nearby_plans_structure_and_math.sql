CREATE OR REPLACE FUNCTION get_nearby_plans (
  query_embedding vector(1536) DEFAULT NULL,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50,
  user_lat float DEFAULT NULL,
  user_lon float DEFAULT NULL,
  user_gender text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  venue text,
  tags text[],
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
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.venue,
    p.tags,
    p.capacity,
    p.gender_reach,
    p.status,
    p.latitude,
    p.longitude,
    p.created_at,
    p.scheduled_at,
    -- Distance (Haversine in km), clamped to <= 1.0 to prevent domain errors
    CASE 
      WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
        (6371 * acos(LEAST(1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lon)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        )))
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
    -- Participants JSON flattened to match Supabase ...profiles(*)
    (
      SELECT json_agg(
        json_build_object(
          'join_status', pp.join_status,
          'intro_message', pp.intro_message,
          'id', participant_prof.id,
          'full_name', participant_prof.full_name,
          'gender', participant_prof.gender,
          'bio', participant_prof.bio,
          'avatar_url', participant_prof.avatar_url,
          'is_verified', participant_prof.is_verified
        )
      )
      FROM public.plan_participants pp
      JOIN public.profiles participant_prof ON participant_prof.id = pp.user_id
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
  ORDER BY 
    CASE WHEN query_embedding IS NOT NULL THEN (1 - (p.embedding <=> query_embedding)) ELSE 0 END DESC,
    CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
      (6371 * acos(LEAST(1.0, cos(radians(user_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(user_lon)) + sin(radians(user_lat)) * sin(radians(p.latitude)))))
    ELSE 0 END ASC NULLS LAST,
    p.created_at DESC
  LIMIT match_count;
END;
$$;
