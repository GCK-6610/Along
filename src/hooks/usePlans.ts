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
      // Use the new RPC function for location & AI-based sorting
      const { data, error } = await supabase
        .rpc('get_nearby_plans', {
          user_lat: userLat,
          user_lon: userLon,
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 50
        });

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
