import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Hotspot } from '../lib/mockData';

export function useHotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotspots();
  }, []);

  const fetchHotspots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sponsored_hotspots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHotspots(data || []);
    } catch (err: any) {
      console.error('Error fetching hotspots:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { hotspots, isLoading, error, refetch: fetchHotspots };
}
