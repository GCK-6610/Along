import { supabase } from './supabase';
import { USE_MOCK_AUTH } from './localSetup';
import { ChatMessageItem } from '../types';

/**
 * Subscribes to Realtime Chat Message changes for a specific Plan ID.
 * Multi-device WebSockets listener with mock mode fallback.
 */
export function subscribeToPlanChat(
  planId: string,
  onMessageReceived: (message: ChatMessageItem) => void
) {
  if (USE_MOCK_AUTH) {
    // In mock mode, log listener attachment
    console.log(`[Realtime Mock] Subscribed to plan chat channel: plan:${planId}`);
    return {
      unsubscribe: () => {
        console.log(`[Realtime Mock] Unsubscribed from plan chat channel: plan:${planId}`);
      },
    };
  }

  const channel = supabase
    .channel(`public:messages:${planId}:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `plan_id=eq.${planId}`,
      },
      (payload: any) => {
        if (payload.new) {
          const newMsg: ChatMessageItem = {
            id: payload.new.id,
            sender_id: payload.new.user_id,
            sender_name: payload.new.sender_name || 'Member',
            text: payload.new.content || payload.new.text,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_me: false,
            is_host: false,
          };
          onMessageReceived(newMsg);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
