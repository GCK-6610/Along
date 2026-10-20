import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, Pressable, TextInput, Platform, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { router } from 'expo-router';
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
const ACTIVITY_CLUSTERS = [
  { id: 'all', label: 'All Plans', emoji: '✨' },
  { id: 'active', label: 'Sports & Active', emoji: '🏃' },
  { id: 'cafes', label: 'Bites & Cafes', emoji: '🍜' },
  { id: 'creative', label: 'Creative & Arts', emoji: '🎨' },
  { id: 'outdoors', label: 'Outdoors & Nature', emoji: '🌿' },
  { id: 'games', label: 'Games & Hobbies', emoji: '🎲' },
  { id: 'tech', label: 'Co-work & Tech', emoji: '💼' },
];

const TAG_CLUSTERS: Record<string, string[]> = {
  active: [
    'active', 'fitness', 'gym', 'workout', 'run', 'running', 'jog', 'jogging',
    'marathon', 'badminton', 'padel', 'pickleball', 'tennis', 'yoga', 'pilates',
    'cycling', 'cycle', 'biking', 'sports', 'football', 'cricket', 'swimming',
    'swim', 'bouldering', 'climbing', 'boxing', 'squash', 'volleyball', 'basketball',
    'skating', 'crossfit', 'hiit', 'athletics'
  ],
  cafes: [
    'cafes', 'cafe', 'bites', 'coffee', 'tea', 'chai', 'roastery', 'brew', 'espresso',
    'matcha', 'bakery', 'boba', 'brunch', 'breakfast', 'lunch', 'dinner', 'food',
    'foodie', 'pizza', 'burger', 'sushi', 'bbq', 'ramen', 'dessert', 'icecream',
    'dining', 'streetfood', 'cooking', 'drinks', 'cocktails', 'brewery', 'beer',
    'pub', 'wine', 'bar', 'supper', 'snacks', 'tasting'
  ],
  creative: [
    'creative', 'art', 'arts', 'painting', 'paint', 'drawing', 'draw', 'sketch',
    'sketching', 'pottery', 'ceramics', 'craft', 'crafts', 'crafting', 'museum',
    'gallery', 'photography', 'photo', 'design', 'theatre', 'theater', 'exhibition',
    'writing', 'culture', 'music', 'concert', 'jam', 'singing', 'dance', 'film',
    'cinema', 'acting', 'sculpture'
  ],
  outdoors: [
    'outdoors', 'outdoor', 'hiking', 'hike', 'nature', 'park', 'walk', 'walking',
    'trail', 'trails', 'camping', 'camp', 'picnic', 'trek', 'trekking', 'sunrise',
    'sunset', 'beach', 'lake', 'lakeside', 'garden', 'gardens', 'backpacking',
    'forest', 'scenic', 'wildlife', 'boating', 'kayaking'
  ],
  games: [
    'games', 'game', 'hobbies', 'hobby', 'boardgames', 'boardgame', 'chess', 'catan',
    'trivia', 'quiz', 'arcade', 'gaming', 'esports', 'videogames', 'playstation',
    'nintendo', 'books', 'book', 'reading', 'bookclub', 'movie', 'movies',
    'dnd', 'cards', 'poker', 'anime', 'manga', 'puzzle', 'puzzles', 'chill',
    'hangout', 'casual', 'social', 'conversation', 'lounge'
  ],
  tech: [
    'tech', 'cowork', 'coworking', 'networking', 'business', 'startup', 'startups',
    'career', 'code', 'coding', 'programming', 'dev', 'developer', 'founders',
    'founder', 'entrepreneur', 'entrepreneurship', 'hackathon', 'workshop', 'ai',
    'web3', 'crypto', 'product', 'designers', 'freelance', 'meetup', 'study',
    'studying'
  ],
};

function matchesCategory(planTags: string[] | undefined, planTitle: string, categoryId: string): boolean {
  if (categoryId === 'all') return true;
  const cluster = TAG_CLUSTERS[categoryId];
  if (!cluster) return false;

  const normalizedTags = (planTags || []).map(t => t.toLowerCase().trim());
  const titleLower = (planTitle || '').toLowerCase();

  for (const tag of normalizedTags) {
    if (tag === categoryId) return true;
    for (const kw of cluster) {
      if (tag === kw || tag.includes(kw) || kw.includes(tag)) {
        return true;
      }
    }
  }

  for (const kw of cluster) {
    if (titleLower.includes(kw)) {
      return true;
    }
  }

  return false;
}

function matchesHotspotCategory(hotspot: any, categoryId: string): boolean {
  if (categoryId === 'all') return true;
  const cluster = TAG_CLUSTERS[categoryId];
  if (!cluster) return false;

  const hTags = (hotspot.tags || []).map((t: string) => t.toLowerCase().trim());
  const nameLower = (hotspot.name || '').toLowerCase();
  const descLower = (hotspot.description || '').toLowerCase();

  for (const t of hTags) {
    for (const kw of cluster) {
      if (t === kw || t.includes(kw) || kw.includes(t)) {
        return true;
      }
    }
  }

  for (const kw of cluster) {
    if (nameLower.includes(kw) || descLower.includes(kw)) {
      return true;
    }
  }

  return false;
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lon: number} | null>(null);
  const mapRef = useRef<MapView>(null);
  const regionTimer = useRef<any>(null);

  const activeLat = mapCenter?.lat ?? userLocation?.lat;
  const activeLon = mapCenter?.lon ?? userLocation?.lon;
  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans(activeLat, activeLon);

  useEffect(() => {
    (async () => {
      // 1. Sync immediately with user profile base location so map centers in their city
      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('base_latitude, base_longitude')
          .eq('id', user.id)
          .maybeSingle();
        if (prof?.base_latitude && prof?.base_longitude) {
          const loc = { lat: prof.base_latitude, lon: prof.base_longitude };
          setUserLocation(prev => prev || loc);
          setMapCenter(prev => prev || loc);
        }
      }

      // 2. Query live GPS
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getLastKnownPositionAsync();
          if (!location) {
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }
          if (location?.coords) {
            const gpsLoc = { lat: location.coords.latitude, lon: location.coords.longitude };
            setUserLocation(gpsLoc);
            setMapCenter(prev => prev || gpsLoc);
          }
        }
      } catch (err) {
        console.warn('GPS location error in explore:', err);
      }
    })();
  }, [user]);

  const handleRegionChangeComplete = (region: any) => {
    if (regionTimer.current) clearTimeout(regionTimer.current);
    regionTimer.current = setTimeout(() => {
      setMapCenter({ lat: region.latitude, lon: region.longitude });
    }, 400);
  };

  const handleRecenter = async () => {
    let target = userLocation;
    if (!target) {
      try {
        let location = await Location.getLastKnownPositionAsync();
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (location?.coords) {
          target = { lat: location.coords.latitude, lon: location.coords.longitude };
          setUserLocation(target);
        }
      } catch {}
    }
    if (target && mapRef.current) {
      setMapCenter(target);
      mapRef.current.animateToRegion({
        latitude: target.lat,
        longitude: target.lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

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


  const filtered = plans.filter(p => {
    const matchCat = matchesCategory(p.tags, p.title, activeCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.venue.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
    return matchCat && matchSearch;
  });

  const filteredHotspots = HOTSPOTS.filter(h => {
    const matchCat = matchesHotspotCategory(h, activeCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      h.name.toLowerCase().includes(q) ||
      (h.description && h.description.toLowerCase().includes(q)) ||
      (h.tags && h.tags.some((t: string) => t.toLowerCase().includes(q)));
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
          {ACTIVITY_CLUSTERS.map(cat => (
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
            showsMyLocationButton={false}
            zoomEnabled={true}
            scrollEnabled={true}
            onRegionChangeComplete={handleRegionChangeComplete}
            initialRegion={{
              latitude: userLocation?.lat || 17.4375,
              longitude: userLocation?.lon || 78.3845,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
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

          {/* Recenter / My Location FAB */}
          <Pressable
            style={[
              styles.recenterFab,
              Boolean(selectedPlan && !showVenues) && styles.recenterFabShifted
            ]}
            onPress={handleRecenter}
          >
            <Navigation size={18} color={theme.colors.primary} />
          </Pressable>
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
  recenterFab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  recenterFabShifted: {
    bottom: 240,
  },
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
