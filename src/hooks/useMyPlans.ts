import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';

const EMPTY_PLANS: Plan[] = [];

export function useMyPlans() {
  const queryResult = useQuery({
    queryKey: ['my_plans'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { hostedPlans: EMPTY_PLANS, joinedPlans: EMPTY_PLANS, requestedPlans: EMPTY_PLANS };

      const userId = session.user.id;

      // Fetch Hosted Plans
      const { data: hostedData, error: hostedError } = await supabase
        .from('plans')
        .select(`
          *,
          host:profiles!plans_host_id_fkey(*),
          participants_list:plan_participants(*, profiles(*))
        `)
        .eq('host_id', userId)
        .order('scheduled_at', { ascending: false });

      if (hostedError) throw hostedError;

      // Fetch Joined and Requested Plans
      const { data: participantData, error: participantError } = await supabase
        .from('plan_participants')
        .select(`
          plan_id,
          join_status,
          plans:plan_id (
            *,
            host:profiles!plans_host_id_fkey(*),
            participants_list:plan_participants(*, profiles(*))
          )
        `)
        .eq('user_id', userId)
        .neq('join_status', 'left')
        .neq('join_status', 'removed');

      if (participantError) throw participantError;

      // Format hosted
      const formattedHosted = (hostedData || []).map(p => ({
        ...p,
        participants_list: p.participants_list?.map((pp: any) => ({
          ...pp,
          ...pp.profiles,
          id: pp.user_id
        }))
      }));

      const formatParticipantPlan = (jp: any) => {
        const p = jp.plans;
        if (!p || p.host_id === userId) return null;
        return {
          ...p,
          participants_list: p.participants_list?.map((pp: any) => ({
            ...pp,
            ...pp.profiles,
            id: pp.user_id
          }))
        };
      };

      // Filter approved vs pending
      const formattedJoined = (participantData || [])
        .filter(jp => jp.join_status === 'approved')
        .map(formatParticipantPlan)
        .filter((p): p is Plan => Boolean(p))
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

      const formattedRequested = (participantData || [])
        .filter(jp => jp.join_status === 'pending')
        .map(formatParticipantPlan)
        .filter((p): p is Plan => Boolean(p))
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

      return {
        hostedPlans: (formattedHosted.length > 0 ? formattedHosted : EMPTY_PLANS) as Plan[],
        joinedPlans: (formattedJoined.length > 0 ? formattedJoined : EMPTY_PLANS) as Plan[],
        requestedPlans: (formattedRequested.length > 0 ? formattedRequested : EMPTY_PLANS) as Plan[]
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes warm cache
    gcTime: 1000 * 60 * 15,
  });

  return { 
    hostedPlans: queryResult.data?.hostedPlans ?? EMPTY_PLANS, 
    joinedPlans: queryResult.data?.joinedPlans ?? EMPTY_PLANS, 
    requestedPlans: queryResult.data?.requestedPlans ?? EMPTY_PLANS,
    isLoading: queryResult.isLoading, 
    error: queryResult.error?.message || null, 
    refetch: queryResult.refetch 
  };
}
