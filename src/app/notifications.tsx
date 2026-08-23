import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Users, MapPin, Info } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
        .order('created_at', { ascending: false });
      
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
      // Mark as read after 2 seconds of being on this screen
      const timer = setTimeout(() => {
        if (user) {
          supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false).then();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'join_request': return <Users size={20} color={theme.colors.primary} />;
      case 'plan_update': return <MapPin size={20} color="#1D9BF0" />;
      default: return <Info size={20} color={theme.colors.mutedForeground} />;
    }
  };

  const handlePress = (item: Notification) => {
    if (item.reference_id) {
      router.push({ pathname: '/plan/[id]', params: { id: item.reference_id } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bell size={40} color={theme.colors.mutedForeground} />
              </View>
              <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.foreground, marginBottom: 8 }}>All caught up!</Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 14, color: theme.colors.mutedForeground }}>No new notifications at the moment.</Text>
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
              {!item.is_read && <View style={styles.unreadDot} />}
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
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 6, marginLeft: 8 },
});
