import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const GENDERS = [
  { value: 'male', label: '👨 Male' },
  { value: 'female', label: '👩 Female' },
  { value: 'other', label: '🧑 Other' },
];

export default function OnboardingScreen() {
  const { user, setHasProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // DiceBear avatar URL based on user ID (no photos needed!)
  const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.id}&backgroundColor=ffb3ba,ffdac1,ffffb5,b5ead7,c7ceea`;

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    if (!gender) {
      Alert.alert('Missing Gender', 'Please select your gender.');
      return;
    }
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName.trim(),
      gender,
      avatar_url: avatarUrl,
      is_verified: false,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setHasProfile(true);
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.wave}>👋</Text>
            <Text style={styles.title}>Let's set up your profile</Text>
            <Text style={styles.subtitle}>This is how others will see you on Along</Text>
          </View>

          {/* Avatar Preview */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {/* Placeholder ring until SVG renders */}
              <View style={styles.avatarRing}>
                <Text style={styles.avatarEmoji}>🧑</Text>
              </View>
            </View>
            <Text style={styles.avatarLabel}>Your auto-generated avatar</Text>
          </View>

          {/* Name Input */}
          <View style={styles.field}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={theme.colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Gender Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>I identify as</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <Pressable
                  key={g.value}
                  style={[styles.genderPill, gender === g.value && styles.genderPillActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderText, gender === g.value && styles.genderTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.button, (!fullName.trim() || !gender) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !fullName.trim() || !gender}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Let's Go 🚀</Text>
            )}
          </Pressable>
        </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  wave: {
    fontSize: 36,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 6,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.mutedForeground,
  },
  field: {
    gap: 6,
    width: '100%',
    maxWidth: '100%',
  },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.foreground,
  },
  input: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
    maxWidth: '100%',
  },
  genderPill: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  genderPillActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: '#fff',
  },
});
