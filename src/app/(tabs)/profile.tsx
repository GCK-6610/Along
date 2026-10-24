import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';

import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { CheckCircle2, LogOut, Settings, Star, Shield, Edit2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useMyPlans } from '../../hooks/useMyPlans';
import { supabase } from '../../lib/supabase';
import PlanCard from '../../components/features/PlanCard';
import { calculateAge } from '../../utils/age';
import { isVerifiedCompletedHangout } from '../../utils/hangoutLifecycle';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<any>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { hostedPlans, joinedPlans, refetch: refetchMyPlans } = useMyPlans();

  useFocusEffect(
    useCallback(() => {
      refetchMyPlans();
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setProfile(data);
          } else {
            setProfile({});
          }
          setLoadingProfile(false);
        });
      }
    }, [user])
  );

  // Upcoming Hangouts (Hosted or Attending that are still active)
  const upcomingHangouts = [
    ...hostedPlans.filter(p => p.status === 'active'),
    ...joinedPlans.filter(p => p.status === 'active'),
  ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Completed Hangouts (Only real, verified completed events where user attended or successfully hosted with guests)
  const completedHangouts = [
    ...hostedPlans.filter(p => isVerifiedCompletedHangout(p, user?.id || '')),
    ...joinedPlans.filter(p => isVerifiedCompletedHangout(p, user?.id || '')),
  ].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Pressable style={styles.settingsBtn} onPress={() => router.push('/edit-profile')}>
              <Edit2 size={18} color={theme.colors.foreground} />
            </Pressable>
            <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings')}>
              <Settings size={20} color={theme.colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Avatar & Info */}
        <View style={styles.profileCard}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatarRing}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.avatarRing}>
              <Text style={styles.avatarEmoji}>🧑</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            {loadingProfile && !profile?.full_name ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 4 }} />
            ) : (
              <>
                <Text style={styles.name}>{profile?.full_name || 'Member'}</Text>
                {profile?.is_verified && <CheckCircle2 size={18} color="#1D9BF0" />}
              </>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text style={styles.phone}>{user?.phone || ''}</Text>
            {profile?.dob && (
              <View style={styles.agePill}>
                <Text style={styles.agePillText}>{calculateAge(profile.dob)} yrs</Text>
              </View>
            )}
          </View>
          {profile?.base_location_name && (
            <Text style={[styles.phone, { marginTop: 4 }]}>📍 {profile.base_location_name}</Text>
          )}
          {profile?.bio && (
            <Text style={[styles.phone, { marginTop: 8, color: theme.colors.foreground, textAlign: 'center', paddingHorizontal: 20 }]}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.events_attended || 0}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.events_hosted || 0}</Text>
            <Text style={styles.statLabel}>Hosted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {profile?.rating_count && profile.rating_count > 0
                ? `★ ${profile.rating_avg ? profile.rating_avg.toFixed(1) : '5.0'}`
                : '⭐ New'}
            </Text>
            <Text style={styles.statLabel}>
              {profile?.rating_count && profile.rating_count > 0 ? `${profile.rating_count} ratings` : 'Community'}
            </Text>
          </View>
        </View>

        {/* Upcoming Hangouts */}
        {upcomingHangouts.length > 0 && (
          <View style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: theme.spacing.xs }}>
              <Text style={styles.menuTitle}>Upcoming Hangouts</Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: theme.colors.primary }}>
                {upcomingHangouts.length} active
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {upcomingHangouts.map(p => (
                <View key={p.id} style={{ width: 280 }}>
                  <PlanCard plan={p as any} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Completed Hangouts (Real Verified Events Attended/Hosted) */}
        {completedHangouts.length > 0 && (
          <View style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: theme.spacing.xs }}>
              <Text style={styles.menuTitle}>Completed Hangouts ✓</Text>
              <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 12, color: '#047857' }}>
                {completedHangouts.length} verified
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {completedHangouts.map(p => (
                <View key={p.id} style={{ width: 280 }}>
                  <PlanCard plan={p as any} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: p.id } })} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {upcomingHangouts.length === 0 && completedHangouts.length === 0 && (
          <View style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.card, padding: 16, borderRadius: theme.borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontFamily: theme.typography.fontFamily.bold, fontSize: 14, color: theme.colors.foreground }}>
              No completed hangouts yet
            </Text>
            <Text style={{ fontFamily: theme.typography.fontFamily.regular, fontSize: 12, color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
              Join or host a hangout to build your verified attendee reputation!
            </Text>
            <Pressable
              style={{ marginTop: 12, backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.pill }}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={{ color: '#fff', fontFamily: theme.typography.fontFamily.bold, fontSize: 12 }}>
                Explore Nearby Hangouts 🚀
              </Text>
            </Pressable>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account</Text>
          
          <Pressable style={styles.menuRow} onPress={() => router.push('/my-plans')}>
            <View style={styles.menuIcon}><Star size={20} color={theme.colors.primary} /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>My Plans</Text>
              <Text style={styles.menuSub}>{profile?.events_hosted || 0} hosted, {profile?.events_attended || 0} attended</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          {!profile?.is_verified && (
            <Pressable style={styles.menuRow} onPress={() => router.push('/verification')}>
              <View style={styles.menuIcon}><Shield size={20} color={theme.colors.primary} /></View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>Verification</Text>
                <Text style={styles.menuSub}>Get your blue tick</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          )}
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <LogOut size={18} color={theme.colors.destructive} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: theme.spacing.md },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' },
  profileCard: { alignItems: 'center', gap: 4, paddingVertical: theme.spacing.sm },
  avatarRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.secondary, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 34 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xl, color: theme.colors.foreground, letterSpacing: -0.3 },
  phone: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  agePill: { backgroundColor: theme.colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  agePillText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.primary },
  statsRow: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: theme.colors.border },
  statValue: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xl, color: theme.colors.foreground },
  statLabel: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textAlign: 'center' },
  menuSection: { gap: theme.spacing.xs },
  menuTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  menuIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.colors.secondary, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  menuSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  menuArrow: { fontFamily: theme.typography.fontFamily.bold, fontSize: 16, color: theme.colors.mutedForeground },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingVertical: 12, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: 'rgba(212,24,61,0.2)', backgroundColor: 'rgba(212,24,61,0.05)' },
  signOutText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.destructive },
});
