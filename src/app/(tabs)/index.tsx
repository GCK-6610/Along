import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, FlatList, StatusBar, Image, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Compass, Flame, Bell } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import * as Location from 'expo-location';

import { ActivityIndicator } from 'react-native';
import { usePlans } from '../../hooks/usePlans';
import { useHotspots } from '../../hooks/useHotspots';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { calculateHaversineDistance } from '../../lib/geoUtils';
import PlanCard from '../../components/features/PlanCard';
import { PlanCardSkeleton, HotspotCardSkeleton } from '../../components/features/Skeletons';
import { Plan, Hotspot } from '../../types';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.user_metadata?.full_name?.split(' ')[0] || 'Explorer');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans(userLocation?.lat, userLocation?.lon);
  const { hotspots, isLoading: hotspotsLoading, refetch: refetchHotspots } = useHotspots();

  const fetchLiveLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          return;
        }
      }
    } catch (e) {
      console.warn('GPS location request error:', e);
    }
    // Fallback to base location in profile
    if (user) {
      const { data } = await supabase.from('profiles').select('base_latitude, base_longitude').eq('id', user.id).maybeSingle();
      if (data?.base_latitude && data?.base_longitude) {
        setUserLocation({ lat: data.base_latitude, lon: data.base_longitude });
      }
    }
  };

  useEffect(() => {
    fetchLiveLocation();
    if (user) {
      // Fetch unread notifications count
      supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(({ count }) => {
          if (count !== null) setUnreadCount(count);
        });
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchLiveLocation();
      refetchPlans();
      refetchHotspots();
      if (user) {
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle().then(({ data }) => {
          if (data && data.full_name) {
            setFirstName(data.full_name.split(' ')[0]);
          }
        });
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPlans(), refetchHotspots(), fetchLiveLocation()]);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Plan }) => (
    <PlanCard plan={item} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })} />
  );

  const renderHotspot = (item: Hotspot) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [styles.hotspotCard, pressed && { transform: [{ scale: 0.97 }], opacity: 0.94 }]}
      onPress={() => router.push({ pathname: '/create', params: { venue: item.name, tags: item.tags?.join(',') } })}
    >
      <Image source={{ uri: item.image_url }} style={styles.hotspotImage} />
      <View style={styles.hotspotOverlay}>
        <View style={styles.hotspotBadgeRow}>
          {item.tags && item.tags.length > 0 && <Text style={styles.hotspotCategory}>#{item.tags[0]}</Text>}
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>PARTNER PERK 🎁</Text>
          </View>
        </View>
        <Text style={styles.hotspotName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotspotDistance}>
          {userLocation ? calculateHaversineDistance(userLocation.lat, userLocation.lon, item.latitude, item.longitude) : '?'} km away
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>{getGreeting()}, {firstName} 👋</Text>
        </View>
        <View style={styles.headerIcon}>
          <Pressable style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
            <Bell size={24} color={theme.colors.foreground} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.mainScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.hotspotsSection}>
          <View style={styles.hotspotsHeader}>
            <Flame size={16} color={theme.colors.primary} />
            <Text style={styles.hotspotsTitle}>Trending Hotspots</Text>
          </View>
          {hotspotsLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotspotsList}>
              <HotspotCardSkeleton />
              <HotspotCardSkeleton />
              <HotspotCardSkeleton />
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotspotsList}>
              {hotspots.map(renderHotspot)}
            </ScrollView>
          )}
        </View>

        {/* Section Label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Plans Near You</Text>
          <Text style={styles.sectionCount}>{plans.length} active</Text>
        </View>

        {/* Feed */}
        {plansLoading ? (
          <View style={styles.list}>
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>No plans nearby yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to create a hangout or explore trending hotspots!</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/create')}>
              <Text style={styles.emptyBtnText}>Create a Plan</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {plans.map(plan => (
              <View key={plan.id} style={{ marginBottom: theme.spacing.lg }}>
                <PlanCard plan={plan} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })} />
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerGreeting: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: 28, color: theme.colors.foreground, letterSpacing: -0.5, marginTop: 4 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  notificationBtn: { position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: theme.colors.primary, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.card },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontFamily: theme.typography.fontFamily.bold },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  mainScroll: {
    flexGrow: 1,
  },
  hotspotsSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  hotspotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  hotspotsTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  hotspotsList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  hotspotCard: {
    width: 200,
    height: 120,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  hotspotImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  hotspotOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  hotspotBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hotspotCategory: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadge: {
    backgroundColor: '#FFD32A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: '#1C1B2E',
    letterSpacing: 0.5,
  },
  hotspotName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: '#FFF',
  },
  hotspotDistance: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.pill,
  },
  emptyBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: '#FFF',
  },
});
