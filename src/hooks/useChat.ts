import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface ChatMessage {
  id: string;
  plan_id: string;
  user_id: string;
  content: string;
  created_at: string;
  isOptimistic?: boolean;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export function useChat(planId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const profileCache = useRef<Map<string, { full_name: string; avatar_url: string }>>(new Map());

  // Prime the current user's profile in cache
  useEffect(() => {
    if (session?.user) {
      profileCache.current.set(session.user.id, {
        full_name: session.user.user_metadata?.full_name || 'You',
        avatar_url: session.user.user_metadata?.avatar_url || '',
      });
    }
  }, [session]);

  const fetchMessages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:profiles(full_name, avatar_url)
      `)
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Seed profile cache with returned authors
      data.forEach((m: any) => {
        if (m.user && m.user_id) {
          profileCache.current.set(m.user_id, m.user);
        }
      });
      setMessages(data as ChatMessage[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!planId) return;

    fetchMessages();

    // Subscribe to new real-time messages
    const channel = supabase
      .channel(`chat_messages:${planId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `plan_id=eq.${planId}`,
        },
        async (payload) => {
          // Reconcile optimistic messages sent by this client
          setMessages((prev) => {
            const isAlreadyPresent = prev.some((m) => m.id === payload.new.id);
            if (isAlreadyPresent) return prev;

            // Remove any matching optimistic message from this user
            const optimisticIndex = prev.findIndex(
              (m) => m.isOptimistic && m.user_id === payload.new.user_id && m.content === payload.new.content
            );

            // Check profile cache first (0ms waterfall)
            let authorProfile = profileCache.current.get(payload.new.user_id);

            const serverMsg: ChatMessage = {
              ...payload.new,
              user: authorProfile,
            };

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = serverMsg;
              return updated;
            }
            return [...prev, serverMsg];
          });

          // If author not yet in cache, fetch once in background and update
          if (!profileCache.current.has(payload.new.user_id)) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            if (userData) {
              profileCache.current.set(payload.new.user_id, userData);
              setMessages((prev) =>
                prev.map((m) => (m.id === payload.new.id ? { ...m, user: userData } : m))
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId]);

  const sendMessage = async (content: string) => {
    const text = content.trim();
    if (!text || !session?.user?.id) return;

    const currentUserId = session.user.id;
    const authorProfile = profileCache.current.get(currentUserId) || {
      full_name: session.user.user_metadata?.full_name || 'You',
      avatar_url: session.user.user_metadata?.avatar_url || '',
    };

    // 1. Optimistic Message for 0ms perceived latency
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      plan_id: planId,
      user_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      user: authorProfile,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. Persist to Supabase
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        plan_id: planId,
        user_id: currentUserId,
        content: text,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      // Reconcile temp ID with permanent ID
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: data.id, isOptimistic: false } : m))
      );
    }
  };

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
}
