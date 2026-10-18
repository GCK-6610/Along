import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, Alert

} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { theme } from '../../styles/theme';
import { getUserFriendlyErrorMessage } from '../../utils/errorHandling';

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (newOtp.every(d => d) && newOtp.join('').length === OTP_LENGTH) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone as string,
        token,
        type: 'sms',
      });

      if (error) {
        setLoading(false);
        Alert.alert(
          'Verification Code',
          getUserFriendlyErrorMessage(
            error,
            'The code you entered is invalid or has expired. Please try again.'
          )
        );
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      }

      // Check profile & direct redirect fallback so user is never stuck
      if (data?.session) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, gender')
            .eq('id', data.session.user.id)
            .maybeSingle();

          setLoading(false);
          const isComplete = Boolean(
            profile &&
            profile.full_name &&
            profile.full_name.trim() !== '' &&
            profile.full_name !== 'New User' &&
            profile.gender &&
            profile.gender !== 'unspecified'
          );

          if (isComplete) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        } catch {
          setLoading(false);
          router.replace('/onboarding');
        }
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert(
        'Verification Unavailable',
        getUserFriendlyErrorMessage(
          e,
          'Something went wrong while verifying your code. Please try again in a moment.'
        )
      );
    }
  };

  const handleResend = async () => {
    setCountdown(60);
    await supabase.auth.signInWithOtp({ phone: phone as string });
    Alert.alert('Code Sent', 'A new verification code has been sent.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        {/* 6-Box OTP */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Verifying…</Text>
          </View>
        )}

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>Resend code in {countdown}s</Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendBtn}>Resend Code</Text>
            </Pressable>
          )}
        </View>

        {/* Dev hint */}
        <View style={styles.devHint}>
          <Text style={styles.devHintText}>🧪 Dev mode: Use OTP <Text style={{ color: theme.colors.primary }}>000000</Text></Text>
        </View>
      </View>
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
    paddingTop: theme.spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  backText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.mutedForeground,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.foreground,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  phoneHighlight: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.foreground,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, marginBottom: theme.spacing.lg, flexWrap: 'wrap', width: '100%', maxWidth: '100%' },
  otpBox: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    height: 54,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.foreground,
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.mutedForeground,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendCountdown: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  resendBtn: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  devHint: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  devHintText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
});
