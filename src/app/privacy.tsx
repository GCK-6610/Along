import { SafeAreaView } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useState } from 'react';
import { safeBack } from '../utils/navigation';

export default function PrivacyScreen() {
  const [womenOnly, setWomenOnly] = useState(false);
  const [hideProfile, setHideProfile] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Reach</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          <ShieldAlert size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Your Privacy First</Text>
          <Text style={styles.subtitle}>Control who can see your profile and join your plans.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DEFAULTS FOR NEW PLANS</Text>

          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Women Only Default</Text>
              <Text style={styles.rowSub}>When creating a plan, default the reach to Women Only.</Text>
            </View>
            <Switch
              value={womenOnly}
              onValueChange={setWomenOnly}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={womenOnly ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PROFILE VISIBILITY</Text>

          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Hide from Explore Map</Text>
              <Text style={styles.rowSub}>Don't show my profile on the explore map to strangers.</Text>
            </View>
            <Switch
              value={hideProfile}
              onValueChange={setHideProfile}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={hideProfile ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
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
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.lg, paddingBottom: 60 },
  headerSection: { alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.md },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 22 },
  section: { gap: theme.spacing.xs },
  sectionHeader: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.mutedForeground, letterSpacing: 1, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  rowSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 4 },
});
