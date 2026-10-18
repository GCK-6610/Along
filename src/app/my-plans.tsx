import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';

import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useMyPlans } from '../hooks/useMyPlans';
import PlanCard from '../components/features/PlanCard';
import { safeBack } from '../utils/navigation';

export default function MyPlansScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'hosted' | 'joined' | 'requested'>('hosted');
  
  const { hostedPlans, joinedPlans, requestedPlans, isLoading, refetch } = useMyPlans();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const displayPlans = activeTab === 'hosted' 
    ? hostedPlans 
    : activeTab === 'joined' 
    ? joinedPlans 
    : requestedPlans;

  const emptyText = activeTab === 'hosted'
    ? 'No hosted plans found'
    : activeTab === 'joined'
    ? 'No joined plans found'
    : 'No pending requests found';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>My Plans</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, activeTab === 'hosted' && styles.tabActive]} onPress={() => setActiveTab('hosted')}>
          <Text style={[styles.tabText, activeTab === 'hosted' && styles.tabTextActive]} numberOfLines={1}>
            Hosted ({hostedPlans.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'joined' && styles.tabActive]} onPress={() => setActiveTab('joined')}>
          <Text style={[styles.tabText, activeTab === 'joined' && styles.tabTextActive]} numberOfLines={1}>
            Joined ({joinedPlans.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'requested' && styles.tabActive]} onPress={() => setActiveTab('requested')}>
          <Text style={[styles.tabText, activeTab === 'requested' && styles.tabTextActive]} numberOfLines={1}>
            Requested ({requestedPlans.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={displayPlans}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlanCard plan={item} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Calendar size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )
        }
      />
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
  iconBtnPlaceholder: { width: 36 },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  tabs: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, paddingVertical: 12, gap: 8 },
  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    paddingHorizontal: 4, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: theme.borderRadius.pill, 
    backgroundColor: theme.colors.card, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 13, color: theme.colors.foreground },
  tabTextActive: { color: '#fff' },
  list: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  empty: { alignItems: 'center', marginTop: 100, gap: theme.spacing.sm },
  emptyText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground },
});
