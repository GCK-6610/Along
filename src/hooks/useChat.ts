import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface ChatMessage {
  id: string;
  plan_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export function useChat(planId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (!planId) return;

    // Fetch initial messages
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
          // payload.new contains the new row, but doesn't have the joined user data.
          // We must fetch the user data for the new message.
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            user: userData,
          } as ChatMessage;

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId]);

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
      setMessages(data as ChatMessage[]);
    }
    setIsLoading(false);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !session?.user?.id) return;
    
    // Optimistic UI update could go here, but for MVP we wait for the server insertion
    // The realtime subscription will automatically catch it and render it.
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        plan_id: planId,
        user_id: session.user.id,
        content: content.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, isLoading, sendMessage };
}
