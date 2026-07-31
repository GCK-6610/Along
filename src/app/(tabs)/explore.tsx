import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { Search } from 'lucide-react-native';
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
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? MOCK_PLANS
    : MOCK_PLANS.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchPill}>
          <Search size={16} color={theme.colors.mutedForeground} />
          <Text style={styles.searchText}>Search plans, venues...</Text>
        </View>
      </View>

      {/* Category filters */}
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

      {/* Results */}
      <FlatList
        data={filtered}
        keyExtractor={(item: Plan) => item.id}
        renderItem={({ item }) => <PlanCard plan={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No plans in this category yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xs },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchText: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
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
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  empty: { alignItems: 'center', paddingTop: 60, gap: theme.spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground },
});
