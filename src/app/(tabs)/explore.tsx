import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Pressable, TextInput, Platform, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Search, MapPin, Map, List, Navigation, ArrowLeft, Image as ImageIcon, X } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { calculateDistance } from '../../utils/distance';
import { supabase } from '../../lib/supabase';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { usePlans } from '../../hooks/usePlans';
import { useHotspots } from '../../hooks/useHotspots';
import PlanCard from '../../components/features/PlanCard';
import { PlanCardSkeleton } from '../../components/features/Skeletons';
import VenueModal from '../../components/features/VenueModal';
import { Plan } from '../../types';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
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
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const mapRef = useRef<MapView>(null);
  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans(userLocation?.lat, userLocation?.lon);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
    })();
  }, []);

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
  const [modalHotspot, setModalHotspot] = useState<any | null>(null);
  const [searchedVenue, setSearchedVenue] = useState<any | null>(null);

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

  const filteredHotspots = HOTSPOTS.filter(h => {
    const matchCat = activeCategory === 'all' || h.tags?.includes(activeCategory);
    const matchSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }).map(h => ({
    ...h,
    distance_km: userLocation && h.latitude && h.longitude 
      ? calculateDistance(userLocation.lat, userLocation.lon, h.latitude, h.longitude) 
      : h.distance_km || 0
  }));

  useEffect(() => {
    if (showVenues && viewMode === 'map' && mapRef.current) {
      const coords = filteredHotspots
        .filter(h => h.latitude && h.longitude)
        .map(h => ({ latitude: h.latitude!, longitude: h.longitude! }));
      
      if (coords.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 50, bottom: 250, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [showVenues, viewMode, activeCategory, HOTSPOTS.length]);

  const selectedPlan = plans.find(p => p.id === selectedPinId) || filtered[0] || plans[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Switcher */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {showVenues ? (
            <Pressable style={styles.backTitleRow} onPress={() => {
              setShowVenues(false);
              setSearchedVenue(null);
            }}>
              <ArrowLeft size={24} color={theme.colors.foreground} />
              <Text style={styles.title}>Find Venues</Text>
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
        {showVenues ? (
          <View style={{ zIndex: 999, marginBottom: 8 }}>
            <GooglePlacesAutocomplete
              placeholder='Search cafes, parks, restaurants...'
              fetchDetails={true}
              onPress={(data, details = null) => {
                if (details?.geometry?.location) {
                  const lat = details.geometry.location.lat;
                  const lng = details.geometry.location.lng;
                  const venueData = {
                    id: 'searched-' + data.place_id,
                    name: details.name || data.structured_formatting?.main_text || data.description,
                    latitude: lat,
                    longitude: lng,
                    address: details.formatted_address || data.structured_formatting?.secondary_text,
                    rating: (details as any).rating,
                    distance_km: userLocation ? calculateDistance(userLocation.lat, userLocation.lon, lat, lng) : 0,
                    isSearched: true
                  };
                  setSearchedVenue(venueData);
                  setModalHotspot(venueData);
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }, 1000);
                  }
                }
              }}
              query={{
                key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                language: 'en',
                ...(userLocation ? { location: `${userLocation.lat},${userLocation.lon}`, radius: '10000' } : {})
              }}
              styles={{
                container: { flex: 0 },
                textInput: {
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.pill,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  color: theme.colors.foreground,
                  height: 44,
                  fontFamily: theme.typography.fontFamily.medium,
                  paddingHorizontal: 20,
                  paddingLeft: 40,
                },
                listView: {
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.borderRadius.md,
                  marginTop: 4,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  position: 'absolute',
                  top: 44,
                  left: 0,
                  right: 0,
                },
                row: {
                  backgroundColor: theme.colors.card,
                  padding: 12,
                },
                description: {
                  color: theme.colors.foreground,
                  fontFamily: theme.typography.fontFamily.medium,
                },
                poweredContainer: { display: 'none' }
              }}
              textInputProps={{
                placeholderTextColor: theme.colors.mutedForeground,
                returnKeyType: "search",
              }}
              renderLeftButton={() => (
                <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 1 }}>
                  <Search size={16} color={theme.colors.mutedForeground} />
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.searchPill}>
            <Search size={16} color={theme.colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plans..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
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
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapGraphic}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsUserLocation={true}
            showsMyLocationButton={true}
            zoomEnabled={true}
            scrollEnabled={true}
            initialRegion={{
              latitude: userLocation?.lat || 28.5921,
              longitude: userLocation?.lon || 77.2250,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            // Apple Maps (iOS default) dark mode
            userInterfaceStyle="dark"
            // Google Maps (Android) dark mode
            customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
            onPress={() => {
              setSelectedPinId(null);
              setSelectedHotspotId(null);
            }}
          >
            {showVenues ? (
              <>
                {searchedVenue && (
                  <Marker
                    coordinate={{ latitude: searchedVenue.latitude, longitude: searchedVenue.longitude }}
                    pinColor="red"
                    onPress={() => {
                      setSelectedHotspotId(searchedVenue.id);
                      setModalHotspot(searchedVenue);
                    }}
                  />
                )}
                {filteredHotspots.map((hotspot) => {
                  return (
                    <Marker
                      key={hotspot.id}
                      coordinate={{
                        latitude: hotspot.latitude || 28.5921,
                        longitude: hotspot.longitude || 77.2250,
                      }}
                      pinColor="gold"
                      onPress={() => {
                        setSelectedHotspotId(hotspot.id);
                        setModalHotspot(hotspot);
                      }}
                    />
                  );
                })}
              </>
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
                  const hotspot = filteredHotspots.find(h => h.id === selectedHotspotId) || filteredHotspots[0];
                  if (!hotspot) {
                    return (
                      <View style={styles.venueCard}>
                        <Text style={styles.venueName}>No venues found nearby.</Text>
                      </View>
                    );
                  }
                  return (
                    <Pressable style={styles.venueCard} onPress={() => setModalHotspot(hotspot)}>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{hotspot.name}</Text>
                        <Text style={styles.venueDist}>{hotspot.distance_km?.toFixed(1)} km away</Text>
                      </View>
                      <Pressable style={styles.hostHereBtn} onPress={() => setModalHotspot(hotspot)}>
                        <Text style={styles.hostHereText}>View Details</Text>
                      </Pressable>
                    </Pressable>
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
            {filteredHotspots.map((hotspot) => (
              <Pressable key={hotspot.id} style={styles.venueCardList} onPress={() => setModalHotspot(hotspot)}>
                 <View style={styles.venueInfo}>
                   <Text style={styles.venueName}>{hotspot.name}</Text>
                   <Text style={styles.venueDist}>{hotspot.distance_km?.toFixed(1)} km away</Text>
                 </View>
                 <Pressable style={styles.hostHereBtn} onPress={() => setModalHotspot(hotspot)}>
                   <Text style={styles.hostHereText}>View Details</Text>
                 </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        ) : plansLoading ? (
          <View style={styles.list}>
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </View>
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
      
      {/* Hotspot / Venue Details Bottom Sheet Modal */}
      <VenueModal modalHotspot={modalHotspot} setModalHotspot={setModalHotspot} />
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
    flex: 1, backgroundColor: '#212121', position: 'relative', overflow: 'hidden',
  },
  mapGridLine1: { position: 'absolute', top: '40%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  mapGridLine2: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  radiusCircle: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255, 71, 87, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.2)',
  },
  mapPin: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailsModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    minHeight: 300,
  },
  modalHeaderDrag: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 24,
    color: theme.colors.foreground,
    marginBottom: 8,
    paddingRight: 40,
  },
  detailsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailsRating: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: '#F59E0B',
  },
  detailsDist: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  detailsDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
  },
});
