import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, FlatList, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Compass, Flame, Bell, MapPin } from 'lucide-react-native';
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
import VenueModal from '../../components/features/VenueModal';
import { Plan, Hotspot } from '../../types';
import { filterPlansByDate, DATE_FILTER_OPTIONS, DateFilterPreset } from '../../lib/dateFilters';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Explorer');
  const [locationName, setLocationName] = useState('Nearby');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(
    profile?.base_latitude && profile?.base_longitude ? { lat: profile.base_latitude, lon: profile.base_longitude } : null
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterPreset>('all');

  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans(userLocation?.lat, userLocation?.lon);
  const { hotspots, isLoading: hotspotsLoading, refetch: refetchHotspots } = useHotspots();

  const displayedPlans = filterPlansByDate(plans, selectedDateFilter);

  // Sync profile metadata instantly whenever cached profile updates
  useEffect(() => {
    if (profile) {
      if (profile.full_name) {
        setFirstName(profile.full_name.split(' ')[0]);
      }
      if (profile.base_location_name) {
        const parts = profile.base_location_name.split(',');
        const formatted = parts.length > 1 ? `${parts[0].trim()}, ${parts[1].trim()}` : profile.base_location_name.trim();
        setLocationName(formatted);
      }
      if (profile.base_latitude && profile.base_longitude) {
        setUserLocation(prev => prev || { lat: profile.base_latitude!, lon: profile.base_longitude! });
      }
    }
  }, [profile]);

  const fetchLiveLocation = async () => {
    let hasProfileLocation = Boolean(profile?.base_location_name);

    // 2. Query device GPS coordinates for proximity sorting
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Fast path: read cached location instantly without blocking hardware GPS
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          // 3.5s timeout safeguard so hardware GPS fix never stalls the UI
          const gpsPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
          loc = await Promise.race([gpsPromise, timeoutPromise]);
        }
        if (loc?.coords) {
          setUserLocation(prev => {
            if (prev) {
              const dLat = Math.abs(prev.lat - loc.coords.latitude);
              const dLon = Math.abs(prev.lon - loc.coords.longitude);
              // Avoid re-renders if position shifted by less than ~200 meters
              if (dLat < 0.002 && dLon < 0.002) return prev;
            }
            return { lat: loc.coords.latitude, lon: loc.coords.longitude };
          });
          // Only reverse geocode as fallback if the user has no base location set in profile
          if (!hasProfileLocation) {
            try {
              const [geo] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
              });
              if (geo) {
                const locality = geo.subregion || geo.district || geo.city || geo.region;
                const city = geo.city || geo.region;
                if (locality && city && locality !== city) {
                  setLocationName(`${locality}, ${city}`);
                } else if (city) {
                  setLocationName(city);
                }
              }
            } catch {
              // Keep fallback
            }
          }
        }
      }
    } catch (e) {
      console.warn('GPS location request error:', e);
    }
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (count !== null) setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    fetchLiveLocation();
    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      // On screen focus, only re-sync notification badge. Let TanStack Query handle plan caching.
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPlans(), refetchHotspots(), fetchLiveLocation(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  const renderPlanItem = useCallback(({ item }: { item: Plan }) => (
    <View style={styles.planCardItemWrapper}>
      <PlanCard plan={item} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })} />
    </View>
  ), []);

  const keyExtractor = useCallback((item: Plan) => item.id, []);

  const renderHotspot = (item: Hotspot) => {
    const isPublicSpot = item.tags?.includes('outdoors') || item.tags?.includes('fitness') || item.name.toLowerCase().includes('park');
    const distanceVal = userLocation ? calculateHaversineDistance(userLocation.lat, userLocation.lon, item.latitude, item.longitude) : null;
    const distanceText = distanceVal != null ? `${distanceVal.toFixed(1)} km away` : 'Nearby';
    const categoryTag = item.tags && item.tags.length > 0 ? `#${item.tags[0]}` : null;

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.hotspotCard, pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }]}
        onPress={() => setSelectedHotspot({
          ...item,
          distance_km: distanceVal != null ? distanceVal : undefined
        })}
      >
        {/* Top Image Section */}
        <View style={styles.hotspotImageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.hotspotImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.hotspotGradientScrim} />
          
          {/* Top-Left Concise Badge */}
          {item.perk_text ? (
            <View style={styles.perkFloatingBadge}>
              <Text style={styles.perkFloatingBadgeText}>🎁 PARTNER PERK</Text>
            </View>
          ) : isPublicSpot ? (
            <View style={styles.publicFloatingBadge}>
              <Text style={styles.publicFloatingBadgeText}>POPULAR SPOT 🌿</Text>
            </View>
          ) : (
            <View style={styles.communityFloatingBadge}>
              <Text style={styles.communityFloatingBadgeText}>COMMUNITY SPOT ✨</Text>
            </View>
          )}

          {/* Top-Right Rating Badge */}
          <View style={styles.ratingFloatingBadge}>
            <Text style={styles.ratingFloatingBadgeText}>
              ★ {(item.google_rating || item.rating || 4.5).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Bottom Info Section */}
        <View style={styles.hotspotBottomPanel}>
          <Text style={styles.hotspotName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.hotspotSubtitle} numberOfLines={1}>
            {categoryTag ? `${categoryTag} • ` : ''}{distanceText}
          </Text>

          {item.perk_text ? (
            <View style={styles.perkHighlightBanner}>
              <Text style={styles.perkHighlightText} numberOfLines={1}>
                🎁 {item.perk_text}
              </Text>
            </View>
          ) : (
            <Text style={styles.hotspotSnippet} numberOfLines={1}>
              {item.description || 'Curated community hotspot'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
          <Text style={styles.headerGreeting}>{getGreeting()}, {firstName} 👋</Text>
          <View style={styles.locationBadgeRow}>
            <MapPin size={13} color={theme.colors.primary} />
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
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

      <FlatList
        data={plansLoading ? [] : displayedPlans}
        keyExtractor={keyExtractor}
        renderItem={renderPlanItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          <>
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
              <Text style={styles.sectionCount}>
                {selectedDateFilter === 'all'
                  ? `${plans.length} active`
                  : `${displayedPlans.length} of ${plans.length} active`}
              </Text>
            </View>

            {/* Date Filter Quick Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateFilterRow}
            >
              {DATE_FILTER_OPTIONS.map((opt) => {
                const isActive = selectedDateFilter === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.dateFilterChip, isActive && styles.dateFilterChipActive]}
                    onPress={() => setSelectedDateFilter(opt.id)}
                  >
                    <Text style={styles.dateFilterEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.dateFilterLabel, isActive && styles.dateFilterLabelActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Skeletons when loading */}
            {plansLoading && (
              <View style={styles.list}>
                <PlanCardSkeleton />
                <PlanCardSkeleton />
                <PlanCardSkeleton />
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !plansLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconRing}>
                <Compass size={32} color={theme.colors.primary} />
              </View>
              {plans.length === 0 ? (
                <>
                  <Text style={styles.emptyTitle}>No plans nearby yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Be the first to create a hangout or explore trending hotspots nearby!
                  </Text>
                  <Pressable style={styles.emptyBtn} onPress={() => router.push('/create')}>
                    <Text style={styles.emptyBtnText}>Host a Hangout 🚀</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>
                    No plans {selectedDateFilter === 'today' ? 'today' : selectedDateFilter === 'tomorrow' ? 'tomorrow' : selectedDateFilter === 'weekend' ? 'this weekend' : 'scheduled'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    There are {plans.length} other hangouts scheduled nearby. Tap below to see all upcoming plans!
                  </Text>
                  <Pressable style={styles.emptyBtn} onPress={() => setSelectedDateFilter('all')}>
                    <Text style={styles.emptyBtnText}>View All Plans ✨</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : undefined
        }
      />


      {/* Venue Exploration Modal */}
      <VenueModal modalHotspot={selectedHotspot} setModalHotspot={setSelectedHotspot} />
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
  locationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
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
    width: 255,
    height: 180,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hotspotImageContainer: {
    width: '100%',
    height: 105,
    position: 'relative',
    backgroundColor: '#1E1D2E',
  },
  hotspotImage: {
    width: '100%',
    height: '100%',
  },
  hotspotGradientScrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  perkFloatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  perkFloatingBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.4,
  },
  publicFloatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
  },
  publicFloatingBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.4,
  },
  communityFloatingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.pill,
  },
  communityFloatingBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 9,
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  ratingFloatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingFloatingBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: '#FFD32A',
  },
  hotspotBottomPanel: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
  },
  hotspotName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  hotspotSubtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginTop: 1,
  },
  perkHighlightBanner: {
    backgroundColor: 'rgba(255, 71, 87, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  perkHighlightText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.primary,
  },
  hotspotSnippet: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  emptyIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 71, 87, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    marginBottom: 6,
  },
  emptyBtn: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
  },
  emptyBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: '#FFF',
  },
  dateFilterRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 8,
  },
  dateFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateFilterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateFilterEmoji: {
    fontSize: 13,
  },
  dateFilterLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  dateFilterLabelActive: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
  planCardItemWrapper: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
});
