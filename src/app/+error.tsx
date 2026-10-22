import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '../styles/theme';
import { BrandLoader } from '../components/common/BrandLoader';
import { getUserFriendlyErrorMessage } from '../utils/errorHandling';

interface GlobalErrorProps {
  error: Error;
  retry: () => void;
}

export default function GlobalErrorBoundary({ error, retry }: GlobalErrorProps) {
  const friendlyMessage = getUserFriendlyErrorMessage(
    error,
    'An unexpected glitch occurred while loading this view. You can reload or return to the home screen.'
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <BrandLoader size="lg" />

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{friendlyMessage}</Text>

        <View style={styles.buttonGroup}>
          <Pressable
            style={styles.retryBtn}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>

          <Pressable
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Return to Home Screen"
          >
            <Text style={styles.homeBtnText}>Return Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.foreground,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    maxWidth: 320,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 280,
    gap: theme.spacing.sm,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  retryBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.sizes.base,
    color: '#fff',
  },
  homeBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  homeBtnText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.foreground,
  },
});
