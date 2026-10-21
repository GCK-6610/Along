import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useState, useEffect } from 'react';
import { safeBack } from '../utils/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PrivacySettings } from '../types';
import { BrandLoader } from '../components/common/BrandLoader';

export default function PrivacyScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<PrivacySettings>({
    show_stats: true,
    show_ratings: true,
    show_location: true,
    show_bio: true,
  });

  useEffect(() => {
    async function loadPrivacy() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('privacy_settings')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.privacy_settings) {
          setSettings({
            show_stats: data.privacy_settings.show_stats !== false,
            show_ratings: data.privacy_settings.show_ratings !== false,
            show_location: data.privacy_settings.show_location !== false,
            show_bio: data.privacy_settings.show_bio !== false,
          });
        }
      } catch (err) {
        console.warn('Failed to load privacy settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrivacy();
  }, [user]);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: updated })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update privacy preferences.');
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Public Profile & Privacy</Text>
        <View style={{ width: 36, alignItems: 'center' }}>
          {saving && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <BrandLoader size="lg" message="Loading privacy settings..." />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <ShieldCheck size={48} color={theme.colors.primary} />
            <Text style={styles.title}>Your Profile Privacy</Text>
            <Text style={styles.subtitle}>
              Customize what other members can see on your public profile card when you host or join hangouts.
            </Text>
          </View>

          {/* Mandatory Community Safety Notice */}
          <View style={styles.mandatoryCard}>
            <View style={styles.mandatoryIconWrap}>
              <Lock size={18} color="#1D9BF0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mandatoryTitle}>Mandatory Trust & Safety Rules</Text>
              <Text style={styles.mandatoryDesc}>
                Your <Text style={styles.boldText}>Name</Text> and verified <Text style={styles.boldText}>Age</Text> are always visible on your public profile card to verify real identity and uphold our 18+ adult tag-along community standards.
              </Text>
            </View>
          </View>

          {/* Customizable Public Profile Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PUBLIC PROFILE CUSTOMIZATION</Text>

            {/* Stats: Attended & Hosted */}
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Hangout Stats</Text>
                <Text style={styles.rowSub}>
                  Show total hangouts you have attended and hosted on Along.
                </Text>
              </View>
              <Switch
                value={settings.show_stats}
                onValueChange={(val) => updateSetting('show_stats', val)}
                trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                thumbColor={settings.show_stats ? theme.colors.primary : '#f4f3f4'}
              />
            </View>

            {/* Along Rating */}
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Along Community Rating</Text>
                <Text style={styles.rowSub}>
                  Show your star rating and review count from concluded hangouts.
                </Text>
              </View>
              <Switch
                value={settings.show_ratings}
                onValueChange={(val) => updateSetting('show_ratings', val)}
                trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                thumbColor={settings.show_ratings ? theme.colors.primary : '#f4f3f4'}
              />
            </View>

            {/* Base Neighborhood */}
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>Base Neighborhood</Text>
                <Text style={styles.rowSub}>
                  Show your neighborhood badge (e.g. Kondapur, Hyderabad) on your card.
                </Text>
              </View>
              <Switch
                value={settings.show_location}
                onValueChange={(val) => updateSetting('show_location', val)}
                trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                thumbColor={settings.show_location ? theme.colors.primary : '#f4f3f4'}
              />
            </View>

            {/* About / Bio */}
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>About & Bio</Text>
                <Text style={styles.rowSub}>
                  Show your bio and personal introduction on your public profile.
                </Text>
              </View>
              <Switch
                value={settings.show_bio}
                onValueChange={(val) => updateSetting('show_bio', val)}
                trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                thumbColor={settings.show_bio ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: 12,
    backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.lg, paddingBottom: 60 },
  headerSection: { alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xl, color: theme.colors.foreground },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  mandatoryCard: {
    flexDirection: 'row', gap: 12, backgroundColor: 'rgba(29, 155, 240, 0.08)',
    borderWidth: 1, borderColor: 'rgba(29, 155, 240, 0.25)', borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'flex-start',
  },
  mandatoryIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(29, 155, 240, 0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  mandatoryTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: '#1D9BF0', marginBottom: 4 },
  mandatoryDesc: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground, lineHeight: 18 },
  boldText: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.foreground },
  section: { gap: theme.spacing.xs },
  sectionHeader: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.mutedForeground, letterSpacing: 1, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  rowSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 4, lineHeight: 16 },
});
