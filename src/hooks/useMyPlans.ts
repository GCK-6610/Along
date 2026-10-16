import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plan } from '../types';

export function useMyPlans() {
  const queryResult = useQuery({
    queryKey: ['my_plans'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { hostedPlans: [], joinedPlans: [] };

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

      // Fetch Joined Plans
      const { data: joinedData, error: joinedError } = await supabase
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

      if (joinedError) throw joinedError;

      // Format hosted
      const formattedHosted = (hostedData || []).map(p => ({
        ...p,
        participants_list: p.participants_list?.map((pp: any) => ({
          ...pp,
          ...pp.profiles,
          id: pp.user_id
        }))
      }));

      // Format joined (excluding hosted ones)
      const formattedJoined = (joinedData || [])
        .map(jp => jp.plans)
        .filter((p: any) => p && p.host_id !== userId) // Don't duplicate hosted plans
        .map((p: any) => ({
          ...p,
          participants_list: p.participants_list?.map((pp: any) => ({
            ...pp,
            ...pp.profiles,
            id: pp.user_id
          }))
        }))
        .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

      return {
        hostedPlans: formattedHosted as any as Plan[],
        joinedPlans: formattedJoined as any as Plan[]
      };
    }
  });

  return { 
    hostedPlans: queryResult.data?.hostedPlans || [], 
    joinedPlans: queryResult.data?.joinedPlans || [], 
    isLoading: queryResult.isLoading, 
    error: queryResult.error?.message || null, 
    refetch: queryResult.refetch 
  };
}
