import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, UserX, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useBlockedUsers, BlockedUserRecord } from '../hooks/useBlockedUsers';
import { safeBack } from '../utils/navigation';
import { BrandLoader } from '../components/common/BrandLoader';

export default function BlockedUsersScreen() {
  const { blockedUsers, isLoading, unblockUser, isUnblocking } = useBlockedUsers();

  const handleUnblock = (record: BlockedUserRecord) => {
    const name = record.profile?.full_name || 'this member';
    Alert.alert(
      'Unblock Member',
      `Are you sure you want to unblock ${name}? They will be able to see and join your public hangouts again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(record.blocked_id);
              Alert.alert('Member Unblocked', `${name} has been unblocked.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not unblock member.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUserRecord }) => {
    const profile = item.profile;
    const name = profile?.full_name || 'Along Member';

    return (
      <View style={styles.userRow}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarLetter}>{name[0]?.toUpperCase() || '👤'}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{name}</Text>
            {profile?.is_verified && <CheckCircle2 size={14} color="#1D9BF0" />}
          </View>
          <Text style={styles.userSub}>Blocked</Text>
        </View>

        <Pressable
          style={styles.unblockBtn}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          <Text style={styles.unblockBtnText}>Unblock</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/settings')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked Members</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <BrandLoader size="lg" message="Loading blocked members..." />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <UserX size={32} color={theme.colors.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No Blocked Members</Text>
              <Text style={styles.emptySub}>
                Members you block will appear here. They cannot view your hangouts or request to join your plans.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.primary,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  userSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  unblockBtn: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(235, 94, 65, 0.2)',
  },
  unblockBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  emptySub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
