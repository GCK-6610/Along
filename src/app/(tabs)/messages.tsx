import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MessageCircle, Users } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const { plans, refetch: refetchPlans } = usePlans();

  useFocusEffect(
    useCallback(() => {
      refetchPlans();
    }, [])
  );

  useEffect(() => {
    if (!user) return;
    const userChats = plans
      .filter(p => p.host_id === user.id || p.participants_list?.some((u: any) => u.id === user.id && u.join_status === 'approved'))
      .map(p => {
        // We aren't fetching real messages yet for the chat list for MVP to save time. 
        // A real impl would fetch the latest message from chat_messages table.
        return {
          id: p.id,
          planTitle: p.title,
          lastMessage: `📍 ${p.venue || 'No location set'}`,
          time: new Date(p.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          unread: 0,
          members: (p.participants_list?.filter((u: any) => u.join_status === 'approved').length || 0) + 1
        };
      });
    setChats(userChats);
  }, [user, plans]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable style={styles.chatRow} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })}>
            <View style={styles.iconWrap}>
              <MessageCircle size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.chatBody}>
              <View style={styles.chatTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{item.planTitle}</Text>
                  <View style={styles.membersBadge}>
                    <Users size={10} color={theme.colors.primary} />
                    <Text style={styles.membersCount}>{item.members}</Text>
                  </View>
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
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Join a plan to start chatting with others</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  list: { paddingHorizontal: theme.spacing.lg },
  separator: { height: 1, backgroundColor: theme.colors.border },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: theme.spacing.sm },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.primary + '30'
  },
  chatBody: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.foreground, flexShrink: 1, letterSpacing: -0.2 },
  membersBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: theme.colors.card, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  membersCount: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  chatTime: { fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: theme.colors.mutedForeground },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, flex: 1 },
  badge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 11, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: theme.spacing.sm },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  emptySubtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
});
