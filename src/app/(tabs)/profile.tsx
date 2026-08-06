import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CheckCircle2, LogOut, Settings, Star, Shield, Edit2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  
  const [profile, setProfile] = useState<any>(user?.user_metadata || {});
  const [stats, setStats] = useState({ hosted: 0, joined: 0 });
  const { plans, refetch: refetchPlans } = usePlans();

  useFocusEffect(
    useCallback(() => {
      refetchPlans();
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
          if (data) setProfile(data);
        });
      }
    }, [user])
  );

  useEffect(() => {
    if (user && plans) {
      const hosted = plans.filter(p => p.host_id === user.id).length;
      const joined = plans.filter(p => p.host_id !== user.id && p.participants_list?.some(u => u.id === user.id && u.join_status === 'approved')).length;
      setStats({ hosted, joined });
    }
  }, [plans, user]);

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
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarRing} />
          ) : (
            <View style={styles.avatarRing}>
              <Text style={styles.avatarEmoji}>🧑</Text>
            </View>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.full_name || 'Your Name'}</Text>
            {profile?.is_verified && <CheckCircle2 size={18} color="#1D9BF0" />}
          </View>
          <Text style={styles.phone}>{user?.phone || '+91 XXXXX XXXXX'}</Text>
          {profile?.bio && (
            <Text style={[styles.phone, { marginTop: 8, color: theme.colors.foreground, textAlign: 'center', paddingHorizontal: 20 }]}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.joined}</Text>
            <Text style={styles.statLabel}>Plans Joined</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.hosted}</Text>
            <Text style={styles.statLabel}>Plans Hosted</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account</Text>
          
          <Pressable style={styles.menuRow} onPress={() => router.push('/my-plans')}>
            <View style={styles.menuIcon}><Star size={20} color={theme.colors.primary} /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>My Plans</Text>
              <Text style={styles.menuSub}>{stats.hosted} hosted, {stats.joined} joined</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuRow} onPress={() => router.push('/verification')}>
            <View style={styles.menuIcon}><Shield size={20} color={theme.colors.primary} /></View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>Verification</Text>
              <Text style={styles.menuSub}>{profile?.is_verified ? 'Verified ✓' : 'Get your blue tick'}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
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
  statsRow: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.sm },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
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
