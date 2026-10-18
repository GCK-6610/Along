import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Star, MapPin } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { safeBack } from '../../utils/navigation';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!id) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setProfile(data);
      setIsLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => safeBack('/(tabs)')} style={styles.backBtn}>
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 16 }}>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack('/(tabs)')} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Member Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 44 }}>👤</Text>
          </View>
        )}
        
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.full_name || 'Member'}</Text>
          {profile.is_verified && <CheckCircle2 size={20} color="#1D9BF0" />}
        </View>
        
        <View style={styles.infoPills}>
          {profile.gender && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other'}</Text>
            </View>
          )}
          {profile.base_location_name && (
            <View style={[styles.pill, styles.pillOutline]}>
              <MapPin size={12} color={theme.colors.primary} />
              <Text style={styles.pillText}>{profile.base_location_name}</Text>
            </View>
          )}
        </View>

        {/* Community Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.events_attended || 0}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.events_hosted || 0}</Text>
            <Text style={styles.statLabel}>Hosted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#D97706' }]}>
              {profile.rating_count && profile.rating_count > 0
                ? `★ ${profile.rating_avg ? profile.rating_avg.toFixed(1) : '5.0'}`
                : '⭐ New'}
            </Text>
            <Text style={styles.statLabel}>
              {profile.rating_count && profile.rating_count > 0 ? `${profile.rating_count} ratings` : 'Community'}
            </Text>
          </View>
        </View>

        {profile.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : (
          <Text style={[styles.bio, { color: theme.colors.mutedForeground, fontStyle: 'italic', marginTop: 12 }]}>
            No bio provided yet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.md, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  backBtn: { padding: 4 },
  container: { padding: theme.spacing.lg, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.xs },
  name: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xl, color: theme.colors.foreground },
  infoPills: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
  pill: { backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillOutline: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  pillText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.primary },
  statsRow: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, width: '100%', alignItems: 'center', marginBottom: theme.spacing.lg },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: theme.colors.border },
  statValue: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  statLabel: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  bioBox: { width: '100%', backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: 6 },
  bioTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8 },
  bio: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground, lineHeight: 20 }
});
