import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';
import { useAuth } from '../context/AuthContext';

export function usePlan(planId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (!planId) throw new Error('No plan ID');
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
      const planData = data as any as Plan;

      // Privacy safeguard: Mask secret location details unless user is host or approved attendee
      const isHost = Boolean(user?.id && planData.host_id === user.id);
      const isApproved = Boolean(
        user?.id && planData.participants_list?.some(
          (p: any) => p.id === user.id && p.join_status === 'approved'
        )
      );

      if (!isHost && !isApproved) {
        planData.secret_location_details = undefined;
      }

      return planData;
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 1, // 1 minute warm cache
    gcTime: 1000 * 60 * 10,
  });

  // Real-time synchronization for plan status and details
  useEffect(() => {
    if (!planId) return;

    const channelId = `plan_sync_${planId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plans',
          filter: `id=eq.${planId}`,
        },
        (payload) => {
          const updatedPlan = payload.new as any;
          if (updatedPlan?.status) {
            queryClient.setQueryData(['plan', planId], (old: any) =>
              old ? { ...old, ...updatedPlan } : old
            );
            queryClient.invalidateQueries({ queryKey: ['plan', planId] });
            queryClient.invalidateQueries({ queryKey: ['my_plans'] });
            queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId, queryClient]);

  const refetchPlan = async () => {
    await queryResult.refetch();
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
      await refetchPlan();
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
    } catch (err) {
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
      await refetchPlan();
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
    } catch (err) {
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
      await refetchPlan();
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
    } catch (err) {
      console.error('Error updating join request:', err);
      throw err;
    }
  };

  return { 
    plan: queryResult.data || null, 
    isLoading: !planId || queryResult.isLoading || queryResult.isPending, 
    isFetched: queryResult.isFetched,
    error: queryResult.error?.message || null, 
    refetch: refetchPlan, 
    requestToJoin, 
    leavePlan, 
    updateJoinRequest 
  };
}
