import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Shield, Camera, Upload } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function VerificationScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (user) {
        const { error } = await supabase.from('profiles').update({ is_verified: true }).eq('id', user.id);
        if (error) throw error;
      }
      setSubmitting(false);
      Alert.alert('Verification Submitted', 'Your profile is now verified!', [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={theme.colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Get Verified</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerSection}>
          <View style={styles.badgeWrap}>
            <Shield size={48} color={theme.colors.primary} />
            <View style={styles.checkWrap}>
              <CheckCircle2 size={24} color="#1D9BF0" fill="#fff" />
            </View>
          </View>
          <Text style={styles.title}>Trust & Safety</Text>
          <Text style={styles.subtitle}>Verify your identity to get a blue checkmark and increase trust in the community.</Text>
        </View>

        {step === 1 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 1: Take a Selfie</Text>
            <View style={styles.placeholderBox}>
              <Camera size={40} color={theme.colors.mutedForeground} />
              <Text style={styles.placeholderText}>Tap to open camera</Text>
            </View>
            <Pressable style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Continue</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 2: Upload ID</Text>
            <View style={styles.placeholderBox}>
              <Upload size={40} color={theme.colors.mutedForeground} />
              <Text style={styles.placeholderText}>Upload Passport or ID</Text>
            </View>
            <Pressable style={styles.btn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit for Verification</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnPlaceholder: { width: 36 },
  headerTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: theme.colors.foreground },
  scroll: { padding: theme.spacing.xl, gap: theme.spacing.xl },
  headerSection: { alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  badgeWrap: { position: 'relative', marginBottom: theme.spacing.sm },
  checkWrap: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#fff', borderRadius: 12 },
  title: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.xxl, color: theme.colors.foreground },
  subtitle: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.sizes.base, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: theme.colors.card, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.md },
  cardTitle: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.lg, color: theme.colors.foreground },
  placeholderBox: { height: 180, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
  placeholderText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.sizes.sm, color: theme.colors.mutedForeground },
  btn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  btnText: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.sizes.base, color: '#fff' }
});
