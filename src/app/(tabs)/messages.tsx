import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { theme } from '../../styles/theme';

const MOCK_CHATS = [
  { id: '1', planTitle: 'Morning Yoga in the Park', lastMessage: 'See you all at 7 AM! 🧘', time: '9:41 AM', unread: 2 },
  { id: '2', planTitle: 'Co-working & Coffee', lastMessage: 'I\'ll grab a table by the window', time: 'Yesterday', unread: 0 },
  { id: '3', planTitle: 'Photography Walk', lastMessage: 'Golden hour starts at 6:15 📸', time: 'Mon', unread: 5 },
];

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable style={styles.chatRow}>
            <View style={styles.iconWrap}>
              <MessageCircle size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.chatBody}>
              <View style={styles.chatTopRow}>
                <Text style={styles.chatTitle} numberOfLines={1}>{item.planTitle}</Text>
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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  chatBody: { flex: 1 },
  chatTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  chatTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, flex: 1, marginRight: 8, letterSpacing: -0.2 },
  chatTime: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  chatBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatPreview: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, flex: 1 },
  badge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: theme.spacing.sm },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  emptySubtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
});
