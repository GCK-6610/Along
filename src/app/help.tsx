import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, HelpCircle, ChevronRight, MessageCircle } from 'lucide-react-native';
import { theme } from '../styles/theme';

const FAQS = [
  { q: 'How do I join a plan?', a: 'You can join a plan by tapping "Join Plan" on any active plan in your feed. If it requires approval, the host will be notified.' },
  { q: 'How do I cancel my attendance?', a: 'Go to "My Plans", tap the plan you want to leave, and press "Leave Plan" at the bottom.' },
  { q: 'What is Verification?', a: 'Verification gives you a blue tick. It means we have verified your government ID for community safety.' },
  { q: 'Is Along free to use?', a: 'Yes! Along is free. Some partnered hotspots may offer premium experiences, but the app itself is free.' },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          <HelpCircle size={48} color={theme.colors.primary} />
          <Text style={styles.title}>How can we help?</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
          {FAQS.map((faq, idx) => (
            <View key={idx} style={styles.faqCard}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CONTACT US</Text>
          <Pressable style={styles.row}>
            <View style={styles.iconWrap}>
              <MessageCircle size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Chat with Support</Text>
              <Text style={styles.rowSub}>Typically replies in a few hours</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>
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
  section: { gap: theme.spacing.sm },
  sectionHeader: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.mutedForeground, letterSpacing: 1, marginBottom: 4 },
  faqCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: 6,
  },
  faqQ: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  faqA: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground, lineHeight: 20 },
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
});
