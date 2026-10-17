import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Hotspot } from '../types';

const EMPTY_HOTSPOTS: Hotspot[] = [];

export function useHotspots() {
  const queryResult = useQuery({
    queryKey: ['sponsored_hotspots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsored_hotspots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data && data.length > 0 ? data : EMPTY_HOTSPOTS) as Hotspot[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 2, // Auto-retry on transient errors like PGRST303 clock skew
    retryDelay: 1000,
  });

  return {
    hotspots: queryResult.data ?? EMPTY_HOTSPOTS,
    isLoading: queryResult.isLoading,
    error: queryResult.error?.message || null,
    refetch: queryResult.refetch,
  };
}

