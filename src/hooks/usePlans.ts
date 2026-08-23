import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';

export function usePlans(userLat?: number, userLon?: number, queryEmbedding?: number[]) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [userLat, userLon, queryEmbedding]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching plans for location:', userLat, userLon);
      // Fetch user gender and base location
      const { data: { session } } = await supabase.auth.getSession();
      let userGender = null;
      let baseLat = null;
      let baseLon = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('gender, base_latitude, base_longitude').eq('id', session.user.id).single();
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
      
      const now = new Date().toISOString();
      const activePlans = ((data as any) || []).filter((p: any) => p.scheduled_at > now);
      
      setPlans(activePlans);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { plans, isLoading, error, refetch: fetchPlans };
}
