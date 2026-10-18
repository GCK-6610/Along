import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';

const EMPTY_PLANS: Plan[] = [];

export function usePlans(userLat?: number, userLon?: number, queryEmbedding?: number[]) {
  // Quantize coordinates to ~200m spatial grid so micro-drifts and minor pans hit cache
  const gridLat = userLat != null ? Math.round(userLat * 500) / 500 : null;
  const gridLon = userLon != null ? Math.round(userLon * 500) / 500 : null;

  const queryResult = useQuery({
    queryKey: ['nearby_plans', gridLat, gridLon, queryEmbedding],
    staleTime: 1000 * 60 * 3, // 3 minutes warm cache
    gcTime: 1000 * 60 * 15,
    queryFn: async () => {
      console.log('Fetching plans for location:', userLat, userLon);
      // Fetch user gender and base location
      const { data: { session } } = await supabase.auth.getSession();
      let userGender = null;
      let baseLat = null;
      let baseLon = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('gender, base_latitude, base_longitude').eq('id', session.user.id).maybeSingle();
        if (profile) {
          userGender = profile.gender;
          baseLat = profile.base_latitude;
          baseLon = profile.base_longitude;
        }
      }

      // Use the new RPC function for location & AI-based sorting
      const finalLat = userLat || baseLat || null;
      const finalLon = userLon || baseLon || null;

      const { data, error } = await supabase
        .rpc('get_nearby_plans', {
          user_lat: finalLat,
          user_lon: finalLon,
          query_embedding: queryEmbedding,
          user_gender: userGender,
          match_threshold: 0.5,
          match_count: 50
        });
      
      console.log('Fetched plans count:', data?.length);

      if (error) throw error;
      
      const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
      const activePlans = ((data as any) || []).filter((p: any) => {
        if (p.status && p.status !== 'active') return false;
        if (!p.scheduled_at) return true;
        return p.scheduled_at >= fourHoursAgo;
      });
      
      return (activePlans.length > 0 ? activePlans : EMPTY_PLANS) as Plan[];
    }
  });

  return { 
    plans: queryResult.data ?? EMPTY_PLANS, 
    isLoading: queryResult.isLoading, 
    error: queryResult.error?.message || null, 
    refetch: queryResult.refetch 
  };
}
