import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
        .single();
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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.colors.foreground} />
        </Pressable>
      </View>
      
      <View style={styles.container}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.muted }]} />
        )}
        
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.full_name}</Text>
          {profile.is_verified && <CheckCircle2 size={20} color="#1D9BF0" />}
        </View>
        
        <View style={styles.infoPills}>
          {profile.gender && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{profile.gender === 'male' ? 'Male' : profile.gender === 'female' ? 'Female' : 'Other'}</Text>
            </View>
          )}
        </View>

        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : (
          <Text style={[styles.bio, { color: theme.colors.mutedForeground, fontStyle: 'italic' }]}>
            No bio provided.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, marginLeft: -8 },
  container: { padding: theme.spacing.xl, alignItems: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: theme.spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.md },
  name: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground },
  infoPills: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  pill: { backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  pillText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.primary },
  bio: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, textAlign: 'center', lineHeight: 22 }
});
