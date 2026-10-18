import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Switch, Alert, Linking

} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft, User, Phone, Shield, Bell, MapPin,
  HelpCircle, LogOut, ChevronRight, CheckCircle2
} from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { safeBack } from '../utils/navigation';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [chatAlertsEnabled, setChatAlertsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Along?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => safeBack('/(tabs)/profile')}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          
          <Pressable style={styles.row} onPress={() => router.push('/edit-profile')}>
            <View style={styles.iconWrap}>
              <User size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Edit Profile</Text>
              <Text style={styles.rowSub}>Name, Bio, Notion Avatar</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Phone size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Phone Number</Text>
              <Text style={styles.rowSub}>{user?.phone || '+91 98765 43210'}</Text>
            </View>
            <CheckCircle2 size={16} color="#1D9BF0" />
          </View>
        </View>

        {/* Section 2: Discovery & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DISCOVERY & PRIVACY</Text>

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <MapPin size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Location Services</Text>
              <Text style={styles.rowSub}>Used for Nearby Map Overlays</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={locationEnabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          <Pressable style={styles.row} onPress={() => router.push('/privacy')}>
            <View style={styles.iconWrap}>
              <Shield size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Public Profile & Privacy</Text>
              <Text style={styles.rowSub}>Stats, ratings, location & bio visibility</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Section 3: Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Bell size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Plan Activity Push Notifications</Text>
              <Text style={styles.rowSub}>Join requests and capacity alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Bell size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Group Chat Alerts</Text>
              <Text style={styles.rowSub}>Messages from joined plan members</Text>
            </View>
            <Switch
              value={chatAlertsEnabled}
              onValueChange={setChatAlertsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
              thumbColor={chatAlertsEnabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Section 4: Support & About */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUPPORT & ABOUT</Text>

          <Pressable style={styles.row} onPress={async () => {
            const url = 'mailto:tag-along@org.com';
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              Alert.alert('No Mail App', 'It looks like you do not have a mail app configured on this device (common on Simulators). Please email tag-along@org.com directly.');
            }
          }}>
            <View style={styles.iconWrap}>
              <HelpCircle size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Email Support</Text>
              <Text style={styles.rowSub}>tag-along@org.com</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.row} onPress={() => router.push('/help')}>
            <View style={styles.iconWrap}>
              <HelpCircle size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Help Center & FAQ</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Section 5: Log Out */}
        <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={theme.colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Along v1.0.0 • Build 2026.08</Text>
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
  section: { gap: theme.spacing.xs },
  sectionHeader: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.mutedForeground, letterSpacing: 1, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.sm, color: theme.colors.foreground },
  rowSub: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    paddingVertical: 14, borderWidth: 1, borderColor: theme.colors.primary,
  },
  logoutText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.primary },
  versionText: { textAlign: 'center', fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: 8 },
});
