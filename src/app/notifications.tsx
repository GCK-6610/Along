import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Users, MapPin, Info, CheckCircle2, X } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { safeBack } from '../utils/navigation';
import { BrandLoader } from '../components/common/BrandLoader';

type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      if (user) {
        // Immediately mark unread as read in database and UI upon viewing
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .then(() => {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          });
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleClearAll = () => {
    if (!user || notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const previous = [...notifications];
            setNotifications([]);
            const { error } = await supabase
              .from('notifications')
              .delete()
              .eq('user_id', user.id);
            if (error) {
              setNotifications(previous);
              Alert.alert('Error', 'Unable to clear notifications. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDismiss = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'join_request': return <Users size={20} color={theme.colors.primary} />;
      case 'join_approved': return <CheckCircle2 size={20} color="#10B981" />;
      case 'join_rejected': return <Info size={20} color={theme.colors.mutedForeground} />;
      case 'plan_update': return <MapPin size={20} color="#1D9BF0" />;
      default: return <Bell size={20} color={theme.colors.primary} />;
    }
  };

  const handlePress = async (item: Notification) => {
    if (!item.is_read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
      await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
    }
    if (item.reference_id) {
      router.push({ pathname: '/plan/[id]', params: { id: item.reference_id } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <Pressable style={styles.clearBtn} onPress={handleClearAll} hitSlop={8}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {isLoading ? (
        <BrandLoader size="lg" message="Loading notifications..." style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={10}
          windowSize={7}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 32 }}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border }}>
                <Bell size={40} color={theme.colors.primary} />
              </View>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 20, color: theme.colors.foreground, marginBottom: 8, textAlign: 'center' }}>
                You're all caught up! ✨
              </Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 22 }}>
                Join requests from members, hangout approvals, and activity updates will pop up right here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.iconContainer}>
                {renderIcon(item.type)}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationBody}>{item.body}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <Pressable
                style={styles.dismissBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleDismiss(item.id);
                }}
                hitSlop={8}
              >
                <X size={15} color={theme.colors.mutedForeground} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.foreground },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.destructive,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primary,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: theme.colors.border
  },
  notificationTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 15, color: theme.colors.foreground, marginBottom: 4 },
  notificationBody: { fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground, marginBottom: 8, lineHeight: 20 },
  timestamp: { fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.colors.mutedForeground },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
