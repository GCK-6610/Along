import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, RefreshControl, Platform } from 'react-native';
import { MessageCircle, Users, Lock, Trash2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useMyPlans } from '../../hooks/useMyPlans';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandLoader } from '../../components/common/BrandLoader';
import {
  getChatLastReadTimestamps,
  subscribeToChatReadEvents,
  ChatReceiptsMap,
  ChatMessageRecord,
} from '../../lib/chatReceipts';

export interface ChatListItem {
  id: string;
  planTitle: string;
  lastMessage: string;
  time: string;
  unread: number;
  members: number;
  isArchived: boolean;
}

interface ParticipantRecord {
  id: string;
  join_status: string;
}

const EMPTY_CHATS: ChatListItem[] = [];
const DISMISSED_CHATS_STORAGE_KEY = '@along:dismissed_archived_chats';

export interface LatestMessageRecord {
  content: string;
  sender: string;
  time: string;
  rawTimestamp: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { hostedPlans, joinedPlans, isLoading, refetch: refetchPlans } = useMyPlans();
  const [latestMessages, setLatestMessages] = useState<Record<string, LatestMessageRecord>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [readTimestamps, setReadTimestamps] = useState<ChatReceiptsMap>({});
  const [rawMessages, setRawMessages] = useState<ChatMessageRecord[]>([]);
  const [dismissedChatIds, setDismissedChatIds] = useState<string[]>([]);

  // Load chat read timestamps
  const loadTimestamps = useCallback(async () => {
    const timestamps = await getChatLastReadTimestamps();
    setReadTimestamps(timestamps);
  }, []);

  const fetchLatestMessages = useCallback(async (planIds: string[]) => {
    if (planIds.length === 0) return;
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select(`
          id,
          plan_id,
          content,
          created_at,
          user_id,
          user:profiles(full_name)
        `)
        .in('plan_id', planIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (data) {
        setRawMessages(data as ChatMessageRecord[]);
        const msgMap: Record<string, LatestMessageRecord> = {};
        for (const msg of data) {
          if (!msgMap[msg.plan_id]) {
            const senderName =
              (msg.user as { full_name?: string } | null)?.full_name?.split(' ')[0] || 'Someone';
            const msgDate = new Date(msg.created_at);
            msgMap[msg.plan_id] = {
              content: msg.content,
              sender: senderName,
              time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              rawTimestamp: isNaN(msgDate.getTime()) ? 0 : msgDate.getTime(),
            };
          }
        }
        setLatestMessages(msgMap);
      }
    } catch (e) {
      console.warn('Error fetching latest messages:', e);
    }
  }, []);

  // Reload timestamps and fresh messages on screen focus
  useFocusEffect(
    useCallback(() => {
      loadTimestamps();
      refetchPlans();
      const allIds = [...hostedPlans, ...joinedPlans].map(p => p.id);
      if (allIds.length > 0) {
        fetchLatestMessages(allIds);
      }
    }, [loadTimestamps, refetchPlans, hostedPlans, joinedPlans, fetchLatestMessages])
  );

  // Subscribe to real-time mark-as-read events
  useEffect(() => {
    loadTimestamps();
    const unsubscribe = subscribeToChatReadEvents(() => {
      loadTimestamps();
    });
    return unsubscribe;
  }, [loadTimestamps]);

  // Recalculate unread map whenever raw messages, read timestamps, or current user change
  useEffect(() => {
    if (rawMessages.length === 0) {
      setUnreadMap({});
      return;
    }

    const nextUnread: Record<string, number> = {};
    for (const msg of rawMessages) {
      if (user?.id && msg.user_id === user.id) continue;
      const lastRead = readTimestamps[msg.plan_id] || 0;
      const msgTime = new Date(msg.created_at).getTime();
      if (!isNaN(msgTime) && msgTime > lastRead) {
        nextUnread[msg.plan_id] = (nextUnread[msg.plan_id] || 0) + 1;
      }
    }
    setUnreadMap(nextUnread);
  }, [rawMessages, readTimestamps, user?.id]);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_CHATS_STORAGE_KEY).then(val => {
      if (val) {
        try {
          setDismissedChatIds(JSON.parse(val));
        } catch (e) {
          console.warn('Failed to parse dismissed chats:', e);
        }
      }
    });
  }, []);

  const handleDeleteArchivedChat = useCallback((planId: string, planTitle: string) => {
    Alert.alert(
      'Remove Archived Chat',
      `Remove "${planTitle}" from your inbox?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDismissedChatIds(prev => {
              const next = [...prev, planId];
              AsyncStorage.setItem(DISMISSED_CHATS_STORAGE_KEY, JSON.stringify(next));
              return next;
            });
          }
        }
      ]
    );
  }, []);

  useEffect(() => {
    const allIds = [...hostedPlans, ...joinedPlans].map(p => p.id);
    if (allIds.length > 0) {
      fetchLatestMessages(allIds);
    }
  }, [hostedPlans, joinedPlans, fetchLatestMessages]);

  // Real-time listener: bump thread to top immediately on new incoming message
  useEffect(() => {
    const allIds = [...hostedPlans, ...joinedPlans].map(p => p.id);
    if (allIds.length === 0) return;

    const channel = supabase
      .channel('public:chat_messages:inbox_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg?.plan_id && allIds.includes(newMsg.plan_id)) {
            fetchLatestMessages(allIds);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hostedPlans, joinedPlans, fetchLatestMessages]);

  const chats = useMemo(() => {
    if (!user) return EMPTY_CHATS;
    
    const allUserPlans = [...hostedPlans, ...joinedPlans].filter(p => !dismissedChatIds.includes(p.id));
    if (allUserPlans.length === 0) return EMPTY_CHATS;
    
    // De-duplicate just in case
    const uniquePlansMap = new Map();
    allUserPlans.forEach(p => uniquePlansMap.set(p.id, p));
    const uniquePlans = Array.from(uniquePlansMap.values());

    return uniquePlans
      .sort((a, b) => {
        const aArchived = a.status === 'completed' || a.status === 'cancelled' || (new Date(a.scheduled_at).getTime() < Date.now() - 10 * 24 * 60 * 60 * 1000);
        const bArchived = b.status === 'completed' || b.status === 'cancelled' || (new Date(b.scheduled_at).getTime() < Date.now() - 10 * 24 * 60 * 60 * 1000);
        if (aArchived !== bArchived) return aArchived ? 1 : -1;

        // Sort by newest chat message activity
        const aMsgTime = latestMessages[a.id]?.rawTimestamp || 0;
        const bMsgTime = latestMessages[b.id]?.rawTimestamp || 0;

        if (aMsgTime > 0 || bMsgTime > 0) {
          if (aMsgTime !== bMsgTime) {
            return bMsgTime - aMsgTime; // Most recently messaged thread jumps to top
          }
        }

        // Fallback: newest created plan or scheduled date
        const aFallback = new Date(a.created_at || a.scheduled_at).getTime();
        const bFallback = new Date(b.created_at || b.scheduled_at).getTime();
        return bFallback - aFallback;
      })
      .map(p => {
        const latest = latestMessages[p.id];
        return {
          id: p.id,
          planTitle: p.title,
          lastMessage: latest ? `${latest.sender}: ${latest.content}` : `📍 ${p.venue || 'No location set'}`,
          time: latest?.time || new Date(p.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          unread: unreadMap[p.id] || 0,
          members: 1 + (p.participants_list || []).filter((u: ParticipantRecord) => u.join_status === 'approved' && u.id !== p.host_id).length,
          isArchived: p.status === 'completed' || p.status === 'cancelled' || (new Date(p.scheduled_at).getTime() < Date.now() - 10 * 24 * 60 * 60 * 1000),
        };
      });
  }, [user, hostedPlans, joinedPlans, latestMessages, unreadMap, dismissedChatIds]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={{ flex: 1, minHeight: 2 }}>
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={7}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetchPlans}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.chatRowWrapper}>
              <Pressable
                style={styles.chatRowMain}
                onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })}
              >
                <View style={[styles.iconWrap, item.isArchived && styles.iconWrapArchived]}>
                  <MessageCircle size={22} color={item.isArchived ? theme.colors.mutedForeground : theme.colors.primary} />
                </View>
                <View style={styles.chatBody}>
                  <View style={styles.chatTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={[styles.chatTitle, item.isArchived && styles.chatTitleArchived]} numberOfLines={1}>{item.planTitle}</Text>
                      {item.isArchived ? (
                        <View style={styles.archivedBadge}>
                          <Lock size={9} color={theme.colors.mutedForeground} />
                          <Text style={styles.archivedText}>ARCHIVED</Text>
                        </View>
                      ) : (
                        <View style={styles.membersBadge}>
                          <Users size={10} color={theme.colors.primary} />
                          <Text style={styles.membersCount}>{item.members}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chatTime}>{item.time}</Text>
                  </View>
                  <View style={styles.chatBottomRow}>
                    <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
                    {item.unread > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
              {item.isArchived && (
                <Pressable
                  style={styles.deleteArchivedBtn}
                  onPress={() => handleDeleteArchivedChat(item.id, item.planTitle)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Trash2 size={16} color={theme.colors.mutedForeground} />
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ alignItems: 'center', marginTop: 80 }}>
                <BrandLoader size="lg" message="Loading conversations..." />
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }}>
                  <MessageCircle size={40} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Active Hangout Chats</Text>
                <Text style={styles.emptySubtitle}>
                  When you host a hangout or get approved to tag along, your group chat room will appear here.
                </Text>
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyBtnText}>Explore Hangouts →</Text>
                </Pressable>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  list: { paddingHorizontal: theme.spacing.lg },
  separator: { height: 1, backgroundColor: theme.colors.border },
  chatRowWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: theme.spacing.sm },
  deleteArchivedBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.primary + '30'
  },
  chatBody: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.foreground, flexShrink: 1, letterSpacing: -0.2 },
  chatTitleArchived: { color: theme.colors.mutedForeground },
  membersBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: theme.colors.card, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  membersCount: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  archivedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.colors.card, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  archivedText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 9, color: theme.colors.mutedForeground, letterSpacing: 0.4 },
  iconWrapArchived: { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
  chatTime: { fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: theme.colors.mutedForeground },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, flex: 1 },
  badge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  emptySubtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textAlign: 'center', paddingHorizontal: theme.spacing.xl, lineHeight: 18 },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.pill,
  },
  emptyBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: '#fff',
  },
});
