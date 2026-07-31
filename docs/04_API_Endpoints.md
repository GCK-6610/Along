# 04 API Endpoints (Supabase Edge Functions & RPCs)

## Overview
This document specifies the serverless API layer for Along. Because we are using Supabase, most CRUD operations are handled directly from the client via the Supabase JS SDK. Custom logic (AI parsing, complex geospatial queries) is handled by Edge Functions or Postgres Remote Procedure Calls (RPCs).

## 1. Edge Functions

### `POST /functions/v1/parse-nlp`
Parses unstructured natural language text from the user and returns structured JSON for the "Create Plan" form.

**Request Body:**
```json
{
  "text": "Playing basketball at 6pm tomorrow at central park"
}
```

**Response (200 OK):**
```json
{
  "title": "Basketball Game",
  "category": "sports",
  "datetime": "2026-08-01T18:00:00Z",
  "venue_name": "Central Park",
  "confidence_score": 0.95
}
```

### `POST /functions/v1/moderate-content`
Hook that runs before inserting a `plan` or `profile` to ensure text/images comply with safety guidelines.

**Request Body (Webhook payload from DB insert):**
```json
{
  "record": {
    "title": "Basketball",
    "description": "Some user description"
  }
}
```

## 2. Postgres RPCs (Stored Procedures)

### `match_plans(user_id UUID, current_lat FLOAT, current_lon FLOAT)`
Returns a feed of suggested plans for the explore tab by combining:
1. Geospatial distance (PostGIS `ST_DWithin`).
2. Semantic similarity (pgvector `<=>` cosine distance).
3. Gender reach policies.

**Parameters:**
- `user_id`: The ID of the requesting user (to extract preferences vector).
- `current_lat`, `current_lon`: To bound the search radius (e.g., < 25km).

**Returns:**
List of plan records enriched with `distance_meters` and `match_score`.

### `check_in_plan(plan_id UUID, current_lat FLOAT, current_lon FLOAT)`
Validates that the user is physically at the venue before marking their attendance as `checked_in`.

**Logic:**
```sql
-- Conceptual logic
DECLARE venue_geom geography;
DECLARE user_geom geography := ST_SetSRID(ST_MakePoint(current_lon, current_lat), 4326);
DECLARE distance FLOAT;
BEGIN
  SELECT geom INTO venue_geom FROM plans WHERE id = plan_id;
  distance := ST_Distance(venue_geom, user_geom);
  
  IF distance <= 100 THEN
     UPDATE plan_participants SET status = 'checked_in' WHERE plan_id = plan_id AND user_id = auth.uid();
     RETURN true;
  ELSE
     RAISE EXCEPTION 'You must be within 100 meters of the venue.';
  END IF;
END;
```
