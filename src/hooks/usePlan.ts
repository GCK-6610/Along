import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';
import { useAuth } from '../context/AuthContext';

export function usePlan(planId: string) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planId) fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      setIsLoading(true);
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
        .eq('id', planId)
        .single();

      if (error) throw error;
      setPlan(data as any);
    } catch (err: any) {
      console.error('Error fetching plan:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const requestToJoin = async (introMessage: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('plan_participants').insert({
        plan_id: planId,
        user_id: user.id,
        join_status: 'pending',
        intro_message: introMessage
      });
      if (error) throw error;
      await fetchPlan();
    } catch (err: any) {
      console.error('Error requesting to join:', err);
      throw err;
    }
  };

  const leavePlan = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('plan_participants').delete()
        .eq('plan_id', planId).eq('user_id', user.id);
      if (error) throw error;
      await fetchPlan();
    } catch (err: any) {
      console.error('Error leaving plan:', err);
      throw err;
    }
  };

  const updateJoinRequest = async (participantId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('plan_participants')
        .update({ join_status: status })
        .eq('plan_id', planId)
        .eq('user_id', participantId);
      if (error) throw error;
      await fetchPlan();
    } catch (err: any) {
      console.error('Error updating join request:', err);
      throw err;
    }
  };

  return { plan, isLoading, error, refetch: fetchPlan, requestToJoin, leavePlan, updateJoinRequest };
}
