import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  countUnreadForPlan,
  computeUnreadSummary,
  getChatLastReadTimestamps,
  markChatAsRead,
  subscribeToChatReadEvents,
  ChatMessageRecord,
} from '../src/lib/chatReceipts';

describe('Chat Receipts & Unread Calculation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('countUnreadForPlan', () => {
    const baseTime = 1700000000000;
    const sampleMessages: ChatMessageRecord[] = [
      {
        id: 'msg-1',
        plan_id: 'plan-a',
        user_id: 'user-other',
        content: 'Hey there',
        created_at: new Date(baseTime + 1000).toISOString(),
      },
      {
        id: 'msg-2',
        plan_id: 'plan-a',
        user_id: 'user-other',
        content: 'Are we meeting?',
        created_at: new Date(baseTime + 2000).toISOString(),
      },
      {
        id: 'msg-3',
        plan_id: 'plan-a',
        user_id: 'user-me',
        content: 'Yes on my way',
        created_at: new Date(baseTime + 3000).toISOString(),
      },
      {
        id: 'msg-4',
        plan_id: 'plan-b',
        user_id: 'user-other',
        content: 'Different plan message',
        created_at: new Date(baseTime + 4000).toISOString(),
      },
    ];

    it('returns 0 when there are no messages or invalid plan id', () => {
      expect(countUnreadForPlan([], 'plan-a', 0)).toBe(0);
      expect(countUnreadForPlan(sampleMessages, '', 0)).toBe(0);
    });

    it('ignores own messages from the unread count', () => {
      // Last read before all messages: 2 from user-other, 1 from user-me
      const count = countUnreadForPlan(sampleMessages, 'plan-a', 0, 'user-me');
      expect(count).toBe(2);
    });

    it('only counts messages strictly newer than lastReadMs', () => {
      const readAt = baseTime + 1500;
      // msg-1 is at +1000 (read), msg-2 is at +2000 (unread), msg-3 is own (+3000)
      const count = countUnreadForPlan(sampleMessages, 'plan-a', readAt, 'user-me');
      expect(count).toBe(1);
    });

    it('returns 0 when lastReadMs is after all messages', () => {
      const count = countUnreadForPlan(sampleMessages, 'plan-a', baseTime + 10000, 'user-me');
      expect(count).toBe(0);
    });
  });

  describe('computeUnreadSummary', () => {
    const now = 1700000000000;
    const messages: ChatMessageRecord[] = [
      {
        plan_id: 'plan-1',
        user_id: 'u-1',
        created_at: new Date(now - 1000).toISOString(),
      },
      {
        plan_id: 'plan-1',
        user_id: 'u-2',
        created_at: new Date(now).toISOString(),
      },
      {
        plan_id: 'plan-2',
        user_id: 'u-3',
        created_at: new Date(now).toISOString(),
      },
    ];

    it('computes summary across multiple plans correctly', () => {
      const lastReadMap = {
        'plan-1': now - 2000, // both unread
        'plan-2': now + 5000, // read
        'plan-3': 0, // no messages
      };

      const summary = computeUnreadSummary(messages, ['plan-1', 'plan-2', 'plan-3'], lastReadMap, 'user-me');
      expect(summary.unreadByPlan['plan-1']).toBe(2);
      expect(summary.unreadByPlan['plan-2']).toBe(0);
      expect(summary.unreadByPlan['plan-3']).toBe(0);
      expect(summary.totalUnread).toBe(2);
    });
  });

  describe('persistence and event notifications', () => {
    it('saves and retrieves last read timestamps', async () => {
      expect(await getChatLastReadTimestamps()).toEqual({});

      await markChatAsRead('plan-xyz', 123456789);
      const loaded = await getChatLastReadTimestamps();
      expect(loaded['plan-xyz']).toBe(123456789);

      await markChatAsRead('plan-abc', 987654321);
      const updated = await getChatLastReadTimestamps();
      expect(updated['plan-xyz']).toBe(123456789);
      expect(updated['plan-abc']).toBe(987654321);
    });

    it('triggers listener callback on markChatAsRead', async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToChatReadEvents(listener);

      await markChatAsRead('plan-test', 5000);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      await markChatAsRead('plan-test-2', 6000);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
