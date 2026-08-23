-- 1. Add completed_plans to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_plans INT DEFAULT 0;

-- 2. Create RPC for nearby/AI plans that returns the proper JSON shape WITH host_id
CREATE OR REPLACE FUNCTION get_nearby_plans (
  query_embedding vector(1536) DEFAULT NULL,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50,
  user_lat float DEFAULT NULL,
  user_lon float DEFAULT NULL
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
    p.host_id,
    p.title,
    p.venue,
    p.tags,
    p.capacity,
    p.gender_reach,
    p.status,
    p.latitude,
    p.longitude,
    p.created_at,
    -- Distance (Haversine in km)
    CASE 
      WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
        (6371 * acos(
          cos(radians(user_lat)) * cos(radians(p.latitude)) * 
          cos(radians(p.longitude) - radians(user_lon)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
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
          'profiles', (
            SELECT row_to_json(participant_prof)
            FROM public.profiles participant_prof
            WHERE participant_prof.id = pp.user_id
          )
        )
      )
      FROM public.plan_participants pp
      WHERE pp.plan_id = p.id
    ) AS participants_list
  FROM public.plans p
  WHERE p.status = 'active'
    AND (
      query_embedding IS NULL 
      OR p.embedding IS NULL 
      OR (1 - (p.embedding <=> query_embedding) > match_threshold)
    )
  ORDER BY 
    CASE WHEN query_embedding IS NOT NULL THEN (1 - (p.embedding <=> query_embedding)) ELSE 0 END DESC,
    CASE WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL THEN
      (6371 * acos(cos(radians(user_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(user_lon)) + sin(radians(user_lat)) * sin(radians(p.latitude))))
    ELSE 0 END ASC NULLS LAST,
    p.created_at DESC
  LIMIT match_count;
END;
$$;

-- 3. RPC to remove a participant
CREATE OR REPLACE FUNCTION remove_participant(p_plan_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_host_id uuid;
BEGIN
  -- Verify the caller is the host
  SELECT host_id INTO v_host_id FROM public.plans WHERE id = p_plan_id;
  IF v_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the host can remove participants';
  END IF;

  UPDATE public.plan_participants
  SET join_status = 'removed'
  WHERE plan_id = p_plan_id AND user_id = p_user_id;
END;
$$;

-- 4. RPC to leave a plan
CREATE OR REPLACE FUNCTION leave_plan(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.plan_participants
  SET join_status = 'left'
  WHERE plan_id = p_plan_id AND user_id = auth.uid();
END;
$$;

-- 5. RPC to mark plan completed
CREATE OR REPLACE FUNCTION mark_plan_completed(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_host_id uuid;
  v_participant_count int;
BEGIN
  -- Verify caller is host
  SELECT host_id INTO v_host_id FROM public.plans WHERE id = p_plan_id;
  IF v_host_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the host can mark the plan as completed';
  END IF;

  -- Ensure there is >= 1 participant (not counting host, wait the user said user count should be greater than 1. This means total users (host+guests) > 1, so guests >= 1)
  -- The query below counts only approved guests because host is not in plan_participants usually (unless we add them)
  SELECT count(*) INTO v_participant_count 
  FROM public.plan_participants 
  WHERE plan_id = p_plan_id AND join_status = 'approved';

  IF v_participant_count < 1 THEN
    RAISE EXCEPTION 'A plan must have at least 1 joined guest to be completed';
  END IF;

  -- Update plan status
  UPDATE public.plans SET status = 'completed' WHERE id = p_plan_id;

  -- Increment host completed_plans
  UPDATE public.profiles SET completed_plans = completed_plans + 1 WHERE id = v_host_id;

  -- Increment all approved participants completed_plans
  UPDATE public.profiles 
  SET completed_plans = completed_plans + 1 
  WHERE id IN (
    SELECT user_id FROM public.plan_participants 
    WHERE plan_id = p_plan_id AND join_status = 'approved' AND user_id != v_host_id
  );
END;
$$;
