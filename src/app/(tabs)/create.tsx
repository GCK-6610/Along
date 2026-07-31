import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Zap, MapPin, Users, Calendar } from 'lucide-react-native';
import { theme } from '../../styles/theme';

const CATEGORIES = [
  { id: 'fitness', label: '🏃 Fitness' },
  { id: 'coffee', label: '☕ Coffee' },
  { id: 'art', label: '🎨 Art' },
  { id: 'food', label: '🍜 Food' },
  { id: 'hiking', label: '🥾 Hiking' },
  { id: 'other', label: '🏷️ Other' },
];

export default function CreateScreen() {
  const [nlpInput, setNlpInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [genderReach, setGenderReach] = useState<'all' | 'same'>('all');

  const handleNLPParse = () => {
    if (!nlpInput.trim()) return;
    setParsing(true);
    // Simulate NLP parse (to be replaced by Supabase Edge Function)
    setTimeout(() => {
      setTitle(nlpInput.split(' at ')[0] || nlpInput);
      setVenue(nlpInput.split(' at ')[1] || '');
      setParsing(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.title}>Create a Plan</Text>
          <Text style={styles.subtitle}>Tell us what you have in mind</Text>

          {/* NLP Input */}
          <View style={styles.nlpCard}>
            <View style={styles.nlpHeader}>
              <Zap size={16} color={theme.colors.accent} />
              <Text style={styles.nlpLabel}>AI Quick Fill</Text>
            </View>
            <TextInput
              style={styles.nlpInput}
              placeholder='e.g. "Morning run at Lodhi Gardens tomorrow 6am"'
              placeholderTextColor={theme.colors.mutedForeground}
              value={nlpInput}
              onChangeText={setNlpInput}
              multiline
            />
            <Pressable
              style={[styles.nlpBtn, !nlpInput.trim() && styles.btnDisabled]}
              onPress={handleNLPParse}
              disabled={parsing || !nlpInput.trim()}
            >
              {parsing
                ? <ActivityIndicator size="small" color={theme.colors.foreground} />
                : <Text style={styles.nlpBtnText}>✨ Auto-fill form</Text>
              }
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Plan Title</Text>
              <TextInput style={styles.input} placeholder="e.g. Morning Run" placeholderTextColor={theme.colors.mutedForeground} value={title} onChangeText={setTitle} />
            </View>

            {/* Venue */}
            <View style={styles.field}>
              <Text style={styles.label}>Venue</Text>
              <View style={styles.inputRow}>
                <MapPin size={16} color={theme.colors.mutedForeground} />
                <TextInput style={[styles.input, styles.inputFlex]} placeholder="e.g. Lodhi Gardens" placeholderTextColor={theme.colors.mutedForeground} value={venue} onChangeText={setVenue} />
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipGrid}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c.id}
                    style={[styles.chip, category === c.id && styles.chipActive]}
                    onPress={() => setCategory(c.id)}
                  >
                    <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Capacity */}
            <View style={styles.field}>
              <Text style={styles.label}>Max Participants</Text>
              <View style={styles.counterCard}>
                <View style={styles.counterRow}>
                  <Users size={16} color={theme.colors.mutedForeground} />
                  <Text style={styles.counterHint}>Participants</Text>
                </View>
                <View style={styles.counterControls}>
                  <Pressable style={styles.counterBtn} onPress={() => setCapacity(c => String(Math.max(2, Number(c) - 1)))}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{capacity}</Text>
                  <Pressable style={styles.counterBtn} onPress={() => setCapacity(c => String(Math.min(20, Number(c) + 1)))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Gender Reach */}
            <View style={styles.field}>
              <Text style={styles.label}>Open to</Text>
              <View style={styles.toggleRow}>
                <Pressable style={[styles.toggle, genderReach === 'all' && styles.toggleActive]} onPress={() => setGenderReach('all')}>
                  <Text style={[styles.toggleText, genderReach === 'all' && styles.toggleTextActive]}>👥 Everyone</Text>
                </Pressable>
                <Pressable style={[styles.toggle, genderReach === 'same' && styles.toggleActive]} onPress={() => setGenderReach('same')}>
                  <Text style={[styles.toggleText, genderReach === 'same' && styles.toggleTextActive]}>🔒 Women Only</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* CTA */}
          <Pressable style={[styles.submitBtn, (!title || !venue || !category) && styles.btnDisabled]} disabled={!title || !venue || !category}>
            <Calendar size={18} color="#fff" />
            <Text style={styles.submitText}>Post Plan</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 80 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxxl, color: theme.colors.foreground, letterSpacing: -0.4 },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground, marginTop: -6 },
  nlpCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: theme.spacing.sm, gap: 6, borderWidth: 1, borderColor: theme.colors.border },
  nlpHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nlpLabel: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.accentForeground },
  nlpInput: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, minHeight: 50, textAlignVertical: 'top' },
  nlpBtn: { backgroundColor: theme.colors.accentForeground, borderRadius: theme.borderRadius.md, paddingVertical: 8, alignItems: 'center' },
  nlpBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: '#fff' },
  form: { gap: theme.spacing.sm },
  field: { gap: 4 },
  label: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xs, color: theme.colors.foreground },
  input: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.foreground, borderWidth: 1, borderColor: theme.colors.border, width: '100%', maxWidth: '100%', minWidth: 0, flexShrink: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingLeft: 12, borderWidth: 1, borderColor: theme.colors.border, width: '100%', maxWidth: '100%' },
  inputFlex: { flex: 1, minWidth: 0, flexShrink: 1, borderWidth: 0 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flexShrink: 1 },
  chip: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  chipTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  counterCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border, flexShrink: 1, maxWidth: '100%' },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  counterHint: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.foreground, lineHeight: 22 },
  counterValue: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground, minWidth: 28, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: theme.spacing.sm },
  toggle: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  toggleActive: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary },
  toggleText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.xs, color: theme.colors.mutedForeground },
  toggleTextActive: { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 14 },
  submitText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});
