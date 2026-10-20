import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useMyPlans } from './useMyPlans';
import {
  getChatLastReadTimestamps,
  computeUnreadSummary,
  subscribeToChatReadEvents,
  ChatMessageRecord,
} from '../lib/chatReceipts';

export function useTotalUnreadMessages(): number {
  const [totalUnread, setTotalUnread] = useState(0);
  const { session } = useAuth();
  const { hostedPlans, joinedPlans } = useMyPlans();
  const cachedMessagesRef = useRef<ChatMessageRecord[]>([]);

  const planIds = [...hostedPlans, ...joinedPlans].map((p) => p.id);

  const calculateAndSet = useCallback(
    async (messages: ChatMessageRecord[]) => {
      if (!session?.user?.id || planIds.length === 0) {
        setTotalUnread(0);
        return;
      }

      const timestamps = await getChatLastReadTimestamps();
      const summary = computeUnreadSummary(messages, planIds, timestamps, session.user.id);
      setTotalUnread(summary.totalUnread);
    },
    [session?.user?.id, planIds.join(',')]
  );

  const refreshMessages = useCallback(async () => {
    if (planIds.length === 0) {
      setTotalUnread(0);
      return;
    }

    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, plan_id, created_at, user_id')
        .in('plan_id', planIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (data) {
        cachedMessagesRef.current = data as ChatMessageRecord[];
        await calculateAndSet(cachedMessagesRef.current);
      }
    } catch (e) {
      console.warn('[useTotalUnreadMessages] Failed to fetch unread messages:', e);
    }
  }, [planIds.join(','), calculateAndSet]);

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  // Recalculate when chat read timestamps change (e.g. user leaves a chat room)
  useEffect(() => {
    const unsubscribe = subscribeToChatReadEvents(() => {
      calculateAndSet(cachedMessagesRef.current);
    });
    return unsubscribe;
  }, [calculateAndSet]);

  // Real-time subscription to incoming messages
  useEffect(() => {
    if (planIds.length === 0) return;

    const channelId = `unread_channel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessageRecord;
          if (planIds.includes(newMsg.plan_id)) {
            // Prepend new message to cached messages
            cachedMessagesRef.current = [newMsg, ...cachedMessagesRef.current];
            await calculateAndSet(cachedMessagesRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planIds.join(','), calculateAndSet]);

  return totalUnread;
}
