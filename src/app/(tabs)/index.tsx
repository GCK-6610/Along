import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, FlatList, StatusBar, Image, ScrollView, Pressable } from 'react-native';
import { useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Compass, Flame } from 'lucide-react-native';
import { theme } from '../../styles/theme';

import { ActivityIndicator } from 'react-native';
import { usePlans } from '../../hooks/usePlans';
import { useHotspots } from '../../hooks/useHotspots';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import PlanCard from '../../components/features/PlanCard';
import { Plan, Hotspot } from '../../types';

export default function HomeScreen() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.user_metadata?.full_name?.split(' ')[0] || 'Rahul');
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  const { plans, isLoading: plansLoading, refetch: refetchPlans } = usePlans(userLocation?.lat, userLocation?.lon);
  const { hotspots, isLoading: hotspotsLoading, refetch: refetchHotspots } = useHotspots();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetchPlans();
      refetchHotspots();
      if (user) {
        supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          if (data && data.full_name) {
            setFirstName(data.full_name.split(' ')[0]);
          }
        });
      }
    }, [user])
  );

  const renderItem = ({ item }: { item: Plan }) => (
    <PlanCard plan={item} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })} />
  );

  const renderHotspot = (item: Hotspot) => (
    <Pressable key={item.id} style={styles.hotspotCard} onPress={() => router.push({ pathname: '/create', params: { venue: item.name, tags: item.tags?.join(',') } })}>
      <Image source={{ uri: item.image_url }} style={styles.hotspotImage} />
      <View style={styles.hotspotOverlay}>
        {item.tags && item.tags.length > 0 && <Text style={styles.hotspotCategory}>#{item.tags[0]}</Text>}
        <Text style={styles.hotspotName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotspotDistance}>{item.distance_km} km away</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good Morning, {firstName} 👋</Text>
          <Text style={styles.headerTitle}>Along</Text>
        </View>
        <View style={styles.headerIcon}>
          <Compass size={24} color={theme.colors.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
        <View style={styles.hotspotsSection}>
          <View style={styles.hotspotsHeader}>
            <Flame size={16} color={theme.colors.primary} />
            <Text style={styles.hotspotsTitle}>Trending Hotspots</Text>
          </View>
          {hotspotsLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
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
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
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
  hotspotCategory: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
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
  }
});
