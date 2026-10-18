-- Migration: Enable Row Level Security on PostGIS spatial_ref_sys reference table
-- Resolves Supabase Security Advisor warning: "Table public.spatial_ref_sys is public, but RLS has not been enabled."
-- Allows read-only access for all roles so spatial operations (e.g. ST_Transform, ST_Distance, PostGIS geography routines) continue functioning without restriction.

ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read-only access to spatial_ref_sys" ON public.spatial_ref_sys;
CREATE POLICY "Allow read-only access to spatial_ref_sys"
  ON public.spatial_ref_sys
  FOR SELECT
  USING (true);
