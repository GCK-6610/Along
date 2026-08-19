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
      // Fetch user gender
      const { data: { session } } = await supabase.auth.getSession();
      let userGender = null;
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('gender').eq('id', session.user.id).single();
        if (profile) userGender = profile.gender;
      }

      // Use the new RPC function for location & AI-based sorting
      const fetchPromise = supabase
        .rpc('get_nearby_plans', {
          user_lat: userLat,
          user_lon: userLon,
          query_embedding: queryEmbedding,
          user_gender: userGender,
          match_threshold: 0.5,
          match_count: 50
        });

      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out after 10s')), 10000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      console.log('Fetched plans count:', data?.length);

      if (error) throw error;
      setPlans((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { plans, isLoading, error, refetch: fetchPlans };
}
