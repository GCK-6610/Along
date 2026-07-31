import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { CheckCircle2, LogOut, Settings, Star, Shield } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';

const STAT_ITEMS = [
  { label: 'Plans Joined', value: '12' },
  { label: 'Plans Hosted', value: '4' },
  { label: 'Along Score', value: '87' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <Pressable style={styles.settingsBtn}>
            <Settings size={22} color={theme.colors.foreground} />
          </Pressable>
        </View>

        {/* Avatar & Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarEmoji}>🧑</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>Your Name</Text>
            <CheckCircle2 size={18} color="#1D9BF0" />
          </View>
          <Text style={styles.phone}>{user?.phone || '+91 XXXXX XXXXX'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STAT_ITEMS.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account</Text>

          {[
            { icon: <Star size={20} color={theme.colors.primary} />, label: 'My Plans', sub: '4 hosted, 12 joined' },
            { icon: <Shield size={20} color={theme.colors.primary} />, label: 'Verification', sub: 'Get your blue tick' },
          ].map((item, i) => (
            <Pressable key={i} style={styles.menuRow}>
              <View style={styles.menuIcon}>{item.icon}</View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
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
