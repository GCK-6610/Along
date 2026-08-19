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
      const fetchPromise = supabase
        .from('sponsored_hotspots')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<{data: null, error: Error}>((_, reject) => 
        setTimeout(() => reject(new Error('Hotspots request timed out after 10s')), 10000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

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
