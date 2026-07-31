import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ScrollView, Pressable, TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Search, MapPin, Map, List, Navigation } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { MOCK_PLANS } from '../../lib/mockData';
import PlanCard from '../../components/features/PlanCard';
import { Plan } from '../../types';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
];

export default function ExploreScreen() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPinId, setSelectedPinId] = useState<string>('plan-1');

  const filtered = MOCK_PLANS.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.venue_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedPlan = MOCK_PLANS.find(p => p.id === selectedPinId) || filtered[0] || MOCK_PLANS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Switcher */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Explore</Text>
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
      <View style={{ height: 44 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map(cat => (
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

      {/* Main Content: Map or List */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {/* Interactive Map Visual */}
          <View style={styles.mapGraphic}>
            <View style={styles.mapGridLine1} />
            <View style={styles.mapGridLine2} />
            
            {/* Map Radius Circle */}
            <View style={styles.radiusCircle} />

            {/* Map Pins */}
            {filtered.map((plan, index) => {
              const offsets = [
                { top: '25%', left: '30%' },
                { top: '45%', left: '65%' },
                { top: '65%', left: '35%' },
              ];
              const pos = offsets[index % offsets.length];
              const isSelected = plan.id === selectedPinId;

              return (
                <Pressable
                  key={plan.id}
                  style={[styles.mapPin, pos, isSelected && styles.mapPinSelected]}
                  onPress={() => setSelectedPinId(plan.id)}
                >
                  <MapPin size={16} color={isSelected ? '#fff' : theme.colors.primary} />
                  <Text style={[styles.mapPinText, isSelected && styles.mapPinTextSelected]}>
                    {plan.category.toUpperCase()} • {plan.distance_km || 1.0}km
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Floating Selected Hotspot Card */}
          {selectedPlan && (
            <View style={styles.hotspotContainer}>
              <View style={styles.hotspotBadge}>
                <Navigation size={12} color={theme.colors.primary} />
                <Text style={styles.hotspotBadgeText}>{selectedPlan.distance_km || 0.8} km away</Text>
              </View>
              <PlanCard
                plan={selectedPlan}
                onPress={() => router.push({ pathname: '/plan/[id]', params: { id: selectedPlan.id } })}
              />
            </View>
          )}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>No plans found</Text>
            </View>
          }
        />
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
});
