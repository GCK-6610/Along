import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Modal, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  const handleSendOTP = async () => {
    const fullPhone = `+91${phone.replace(/\s/g, '')}`;
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) {
      Alert.alert(
        'Unable to Send Code',
        getUserFriendlyErrorMessage(
          error,
          'Something went wrong while sending your code. Please check your connection and try again.'
        )
      );
    } else {
      router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoTitle}>Along</Text>
          <Text style={styles.logoSubtitle}>Find your people, in real life.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter your phone</Text>
          <Text style={styles.cardSubtitle}>We'll send you a one-time code to verify your number</Text>

          {/* Phone input */}
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor={theme.colors.mutedForeground}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>

          <Pressable
            style={[styles.button, (loading || phone.length < 10) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading || phone.length < 10}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP →</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.disclaimerLink}
            onPress={() => setLegalModalType('terms')}
            accessibilityRole="link"
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.disclaimerLink}
            onPress={() => setLegalModalType('privacy')}
            accessibilityRole="link"
          >
            Privacy Policy
          </Text>.
        </Text>
      </KeyboardAvoidingView>

      {/* Legal Agreement Modal (EULA & Privacy Policy for App Store Compliance) */}
      <Modal
        visible={Boolean(legalModalType)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModalType(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {legalModalType === 'terms' ? 'Terms of Service (EULA)' : 'Privacy Policy'}
            </Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setLegalModalType(null)}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={true}>
            {legalModalType === 'terms' ? (
              <>
                <Text style={styles.legalSectionTitle}>1. Community Safety & Zero Tolerance</Text>
                <Text style={styles.legalParagraph}>
                  Along is dedicated to real-world spontaneous hangouts. We enforce a strict zero-tolerance policy against harassment, hate speech, stalking, abusive behavior, and objectionable user-generated content. Violating accounts are permanently banned.
                </Text>

                <Text style={styles.legalSectionTitle}>2. User-Generated Content & Moderation</Text>
                <Text style={styles.legalParagraph}>
                  Members can create hangouts and chat with approved participants. Users can report any objectionable content or block abusive members at any time using in-app safety controls. Reports are reviewed by moderators within 24 hours.
                </Text>

                <Text style={styles.legalSectionTitle}>3. Real-World Hangout Safety</Text>
                <Text style={styles.legalParagraph}>
                  All hangouts are designed for public venues (cafes, bouldering gyms, restaurants). Members agree to exercise personal discretion and caution. Along is a facilitation platform and is not liable for member actions outside the app.
                </Text>

                <Text style={styles.legalSectionTitle}>4. Account Termination</Text>
                <Text style={styles.legalParagraph}>
                  You may permanently delete your account and all associated data at any time directly in Settings. Along reserves the right to terminate accounts that breach these Terms.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.legalSectionTitle}>1. Data We Collect</Text>
                <Text style={styles.legalParagraph}>
                  Along collects your phone number for authentication, location data to show nearby hangouts, and voluntary identity documents for optional verification badges.
                </Text>

                <Text style={styles.legalSectionTitle}>2. How Location is Used</Text>
                <Text style={styles.legalParagraph}>
                  Your precise location is used strictly while the app is in use to calculate distances to nearby hangouts and venues. Your real-time location is never sold, shared with advertisers, or broadcast to other users.
                </Text>

                <Text style={styles.legalSectionTitle}>3. Identity Verification Privacy</Text>
                <Text style={styles.legalParagraph}>
                  Government ID scans and selfie liveness photos are processed securely to verify age and authenticity. Verification records are encrypted and protected by strict row-level security.
                </Text>

                <Text style={styles.legalSectionTitle}>4. Data Deletion & Privacy Rights</Text>
                <Text style={styles.legalParagraph}>
                  You can permanently erase your profile, chat messages, and account data anytime via Settings and selecting Delete Account Permanently.
                </Text>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.display,
    color: theme.colors.foreground,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.foreground,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
    maxWidth: '100%',
  },
  countryCode: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    flexShrink: 0,
  },
  countryCodeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
  input: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: '#fff',
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.foreground,
  },
  modalCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary,
  },
  modalCloseText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
  },
  modalBody: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  legalSectionTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    marginTop: 16,
    marginBottom: 6,
  },
  legalParagraph: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 22,
    marginBottom: 8,
  },
});
