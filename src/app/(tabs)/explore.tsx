import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ScrollView, Pressable, TextInput, Platform, ActivityIndicator
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Search, MapPin, Map, List, Navigation, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePlans } from '../../hooks/usePlans';
import { useHotspots } from '../../hooks/useHotspots';

const TRENDING_TAGS = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'networking', label: 'Network', emoji: '🤝' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌿' },
  { id: 'chill', label: 'Chill', emoji: '🛋️' },
  { id: 'food', label: 'Food', emoji: '🍜' },
];

export default function ExploreScreen() {
  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans();

  const darkMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#181818" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2c2c2c" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#000000" }]
    }
  ];
  const { hotspots: HOTSPOTS, isLoading: hotspotsLoading, refetch: refetchHotspots } = useHotspots();
  
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showVenues, setShowVenues] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetchPlans();
      refetchHotspots();
    }, [])
  );

  const filtered = plans.filter(p => {
    const matchCat = activeCategory === 'all' || (p.tags && p.tags.includes(activeCategory));
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedPlan = plans.find(p => p.id === selectedPinId) || filtered[0] || plans[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Switcher */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {showVenues ? (
            <Pressable style={styles.backTitleRow} onPress={() => setShowVenues(false)}>
              <ArrowLeft size={24} color={theme.colors.foreground} />
              <Text style={styles.title}>Curated Venues</Text>
            </Pressable>
          ) : (
            <Text style={styles.title}>Explore</Text>
          )}
          {/* Map/List Switcher */}
          <View style={styles.switcher}>
            <Pressable
              style={[styles.switchBtn, viewMode === 'map' && styles.switchBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Map size={14} color={viewMode === 'map' ? theme.colors.primary : theme.colors.mutedForeground} />
              <Text style={[styles.switchText, viewMode === 'map' && styles.switchTextActive]}>Map</Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, viewMode === 'list' && styles.switchBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={14} color={viewMode === 'list' ? theme.colors.primary : theme.colors.mutedForeground} />
              <Text style={[styles.switchText, viewMode === 'list' && styles.switchTextActive]}>List</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchPill}>
          <Search size={16} color={theme.colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plans, venues, hosts..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Horizontal Filter Row */}
      {!showVenues && (
        <View style={{ height: 44 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TRENDING_TAGS.map(cat => (
            <Pressable
              key={cat.id}
              style={[styles.filterChip, activeCategory === cat.id && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={styles.filterEmoji}>{cat.emoji}</Text>
              <Text style={[styles.filterLabel, activeCategory === cat.id && styles.filterLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      )}

      {/* Main Content: Map or List */}
      {(plansLoading || hotspotsLoading) ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.mapGraphic}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: 28.5921, // Delhi approx
              longitude: 77.2250,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            customMapStyle={darkMapStyle}
          >
            {showVenues ? (
              HOTSPOTS.map((hotspot) => {
                const isSelected = hotspot.id === selectedHotspotId;
                return (
                  <Marker
                    key={hotspot.id}
                    coordinate={{
                      latitude: hotspot.latitude || 28.5921,
                      longitude: hotspot.longitude || 77.2250,
                    }}
                    onPress={() => setSelectedHotspotId(hotspot.id)}
                  >
                    <View style={[styles.mapPin, styles.hotspotMapPin, isSelected && styles.mapPinSelected]}>
                      <ImageIcon size={14} color={isSelected ? '#fff' : theme.colors.primary} />
                    </View>
                  </Marker>
                );
              })
            ) : (
              filtered.map((plan) => {
                const isSelected = plan.id === selectedPinId;
                return (
                  <Marker
                    key={plan.id}
                    coordinate={{
                      latitude: plan.latitude || 28.5921,
                      longitude: plan.longitude || 77.2250,
                    }}
                    onPress={() => setSelectedPinId(plan.id)}
                  >
                    <View style={[styles.mapPin, isSelected && styles.mapPinSelected]}>
                      <MapPin size={16} color={isSelected ? '#fff' : theme.colors.primary} />
                      <Text style={[styles.mapPinText, isSelected && styles.mapPinTextSelected]}>
                        {(plan.tags?.[0] || 'OTHER').toUpperCase()}
                      </Text>
                    </View>
                  </Marker>
                );
              })
            )}
          </MapView>

          {/* Floating Cards and CTAs */}
           {showVenues ? (
             <View style={styles.hotspotContainer}>
                {(() => {
                  const hotspot = HOTSPOTS.find(h => h.id === selectedHotspotId) || HOTSPOTS[0];
                  if (!hotspot) {
                    return (
                      <View style={styles.venueCard}>
                        <Text style={styles.venueName}>No venues found nearby.</Text>
                      </View>
                    );
                  }
                  return (
                    <View style={styles.venueCard}>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{hotspot.name}</Text>
                        <Text style={styles.venueDist}>{hotspot.distance_km} km away</Text>
                      </View>
                      <Pressable style={styles.hostHereBtn} onPress={() => router.push({ pathname: '/create', params: { venue: hotspot.name, tags: hotspot.tags?.join(',') || '' } })}>
                        <Text style={styles.hostHereText}>Host Here</Text>
                      </Pressable>
                    </View>
                  );
                })()}
             </View>
           ) : (
            <>
              {selectedPlan && (
                <View style={styles.hotspotContainer}>
                  <PlanCard
                    plan={selectedPlan}
                    onPress={() => router.push({ pathname: '/plan/[id]', params: { id: selectedPlan.id } })}
                  />
                </View>
              )}
              {/* Find Venues Floating CTA */}
              <Pressable style={styles.floatingVibeBtn} onPress={() => setShowVenues(true)}>
                 <Text style={styles.floatingVibeText}>Find Venues 🔍</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
        showVenues ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {HOTSPOTS.map((hotspot) => (
              <View key={hotspot.id} style={styles.venueCardList}>
                 <View style={styles.venueInfo}>
                   <Text style={styles.venueName}>{hotspot.name}</Text>
                   <Text style={styles.venueDist}>{hotspot.distance_km} km away</Text>
                 </View>
                 <Pressable style={styles.hostHereBtn} onPress={() => router.push({ pathname: '/create', params: { venue: hotspot.name, tags: hotspot.tags?.join(',') || '' } })}>
                   <Text style={styles.hostHereText}>Host Here</Text>
                 </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item: Plan) => item.id}
            renderItem={({ item }) => (
              <PlanCard
                plan={item}
                onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={styles.noVibeContainer}>
                <Text style={styles.noVibeTitle}>Didn't find the vibe?</Text>
                <Pressable style={styles.noVibeBtn} onPress={() => setShowVenues(true)}>
                  <Text style={styles.noVibeBtnText}>Discover nearby venues to host</Text>
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No plans found</Text>
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xs },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  switcher: {
    flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill,
    padding: 3, borderWidth: 1, borderColor: theme.colors.border, gap: 2,
  },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
  },
  switchBtnActive: { backgroundColor: theme.colors.secondary },
  switchText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  switchTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1, fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs,
    color: theme.colors.foreground, padding: 0,
  },
  filterRow: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xs, gap: theme.spacing.xs },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  filterChipActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  filterEmoji: { fontSize: 13 },
  filterLabel: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  filterLabelActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  mapContainer: { flex: 1, position: 'relative' },
  mapGraphic: {
    flex: 1, backgroundColor: '#EBE9E2', position: 'relative', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  mapGridLine1: { position: 'absolute', top: '40%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  mapGridLine2: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  radiusCircle: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255, 71, 87, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  mapPin: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.card, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  mapPinSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  mapPinText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.foreground },
  mapPinTextSelected: { color: '#fff' },
  hotspotMapPin: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  hotspotMapPinText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  hotspotContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, gap: 6 },
  hotspotBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.card, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border,
  },
  hotspotBadgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, paddingTop: theme.spacing.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: theme.spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground },
  
  backTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  floatingVibeBtn: {
    position: 'absolute', top: 16, alignSelf: 'center',
    backgroundColor: theme.colors.card, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: theme.borderRadius.pill, borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  floatingVibeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.primary },
  noVibeContainer: {
    backgroundColor: theme.colors.secondary, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, marginTop: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.sm
  },
  noVibeTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.primary },
  noVibeBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.borderRadius.pill },
  noVibeBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: '#fff' },
  
  venueCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  venueCardList: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.md
  },
  venueInfo: { flex: 1, gap: 4 },
  venueName: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  venueDist: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  hostHereBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.pill },
  hostHereText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: '#fff' },
});
