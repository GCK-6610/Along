import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';

export interface BlockedUserRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  profile?: Profile;
}

const EMPTY_BLOCKED: BlockedUserRecord[] = [];

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['blocked_users'],
    queryFn: async (): Promise<BlockedUserRecord[]> => {
      if (!user?.id) return EMPTY_BLOCKED;

      const { data, error } = await supabase
        .from('blocks')
        .select(`
          id,
          blocker_id,
          blocked_id,
          created_at,
          profile:profiles!blocks_blocked_id_fkey(*)
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching blocked users:', error.message);
        return EMPTY_BLOCKED;
      }

      return (data as unknown as BlockedUserRecord[]) || EMPTY_BLOCKED;
    },
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes warm cache
    gcTime: 1000 * 60 * 20,
  });

  const blockedUsers = queryResult.data ?? EMPTY_BLOCKED;

  const blockedUserIds = useMemo(() => {
    return new Set(blockedUsers.map(b => b.blocked_id));
  }, [blockedUsers]);

  const isBlocked = useCallback((targetUserId: string): boolean => {
    if (!targetUserId) return false;
    return blockedUserIds.has(targetUserId);
  }, [blockedUserIds]);

  const blockMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('You must be signed in to block a member');
      if (user.id === targetUserId) throw new Error('You cannot block yourself');

      const { error } = await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: targetUserId,
      });

      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked_users'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('You must be signed in to unblock a member');

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked_users'] });
      queryClient.invalidateQueries({ queryKey: ['nearby_plans'] });
      queryClient.invalidateQueries({ queryKey: ['my_plans'] });
    },
  });

  return {
    blockedUsers,
    blockedUserIds,
    isBlocked,
    blockUser: blockMutation.mutateAsync,
    unblockUser: unblockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isLoading: queryResult.isLoading,
    refetch: queryResult.refetch,
  };
}
