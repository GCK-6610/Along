import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHAT_LAST_READ_STORAGE_KEY = '@along_chat_last_read';

export interface ChatReceiptsMap {
  [planId: string]: number;
}

export interface ChatMessageRecord {
  id?: string;
  plan_id: string;
  content?: string;
  created_at: string;
  user_id?: string;
}

export interface UnreadSummary {
  unreadByPlan: Record<string, number>;
  totalUnread: number;
}

type ChatReadListener = () => void;
const listeners = new Set<ChatReadListener>();

/**
 * Subscribes a listener to chat read timestamp changes
 */
export function subscribeToChatReadEvents(listener: ChatReadListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Dispatches an event to all subscribers when read status updates
 */
export function notifyChatReadEvent(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[ChatReceipts] Error executing read listener:', e);
    }
  });
}

/**
 * Retrieves all plan read timestamps from local storage
 */
export async function getChatLastReadTimestamps(): Promise<ChatReceiptsMap> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_LAST_READ_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as ChatReceiptsMap;
    }
    return {};
  } catch (err) {
    console.warn('[ChatReceipts] Failed to load chat read timestamps:', err);
    return {};
  }
}

/**
 * Marks a specific plan group chat as read up to the given timestamp
 */
export async function markChatAsRead(planId: string, timestamp = Date.now()): Promise<void> {
  if (!planId) return;

  try {
    const current = await getChatLastReadTimestamps();
    current[planId] = timestamp;
    await AsyncStorage.setItem(CHAT_LAST_READ_STORAGE_KEY, JSON.stringify(current));
    notifyChatReadEvent();
  } catch (err) {
    console.warn('[ChatReceipts] Failed to mark chat as read:', err);
  }
}

/**
 * Counts unread messages for a single plan
 */
export function countUnreadForPlan(
  messages: ChatMessageRecord[],
  planId: string,
  lastReadMs: number,
  currentUserId?: string
): number {
  if (!messages || messages.length === 0 || !planId) return 0;

  return messages.filter((msg) => {
    if (msg.plan_id !== planId) return false;
    if (currentUserId && msg.user_id === currentUserId) return false;
    const msgTime = new Date(msg.created_at).getTime();
    return !isNaN(msgTime) && msgTime > lastReadMs;
  }).length;
}

/**
 * Computes unread counts per plan and the aggregate total
 */
export function computeUnreadSummary(
  messages: ChatMessageRecord[],
  planIds: string[],
  lastReadMap: ChatReceiptsMap,
  currentUserId?: string
): UnreadSummary {
  const unreadByPlan: Record<string, number> = {};
  let totalUnread = 0;

  for (const planId of planIds) {
    const lastRead = lastReadMap[planId] || 0;
    const count = countUnreadForPlan(messages, planId, lastRead, currentUserId);
    unreadByPlan[planId] = count;
    totalUnread += count;
  }

  return {
    unreadByPlan,
    totalUnread,
  };
}
