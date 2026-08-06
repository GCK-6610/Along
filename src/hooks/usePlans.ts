import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      
      // In a real production app, we would join with plan_participants and profiles
      // to get the nested structure expected by the UI.
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          host:profiles!plans_host_id_fkey(*),
          participants_list:plan_participants(
            join_status,
            intro_message,
            ...profiles(*)
          )
        `)
        .order('created_at', { ascending: false });

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
