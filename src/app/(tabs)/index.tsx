import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { Compass } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { MOCK_PLANS } from '../../lib/mockData';
import PlanCard from '../../components/features/PlanCard';
import { Plan } from '../../types';

export default function HomeScreen() {
  const renderItem = ({ item }: { item: Plan }) => (
    <PlanCard plan={item} onPress={() => console.log('Plan pressed:', item.id)} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good Morning 👋</Text>
          <Text style={styles.headerTitle}>Along</Text>
        </View>
        <View style={styles.headerIcon}>
          <Compass size={24} color={theme.colors.primary} />
        </View>
      </View>

      {/* Section Label */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Plans Near You</Text>
        <Text style={styles.sectionCount}>{MOCK_PLANS.length} active</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={MOCK_PLANS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  headerGreeting: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xxxl,
    color: theme.colors.foreground,
    letterSpacing: -0.4,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
