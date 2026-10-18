import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert

} from 'react-native';
import { router, Redirect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';

export default function LoginScreen() {
  const { session, loading: authLoading, hasProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Guard: if already logged in with a profile, redirect to main tabs
  if (!authLoading && session && hasProfile) {
    return <Redirect href="/(tabs)" />;
  }

  // Guard: if logged in but onboarding pending, redirect to onboarding
  if (!authLoading && session && !hasProfile) {
    return <Redirect href="/onboarding" />;
  }

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
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
});
