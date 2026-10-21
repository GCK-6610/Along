import 'react-native-url-polyfill/auto';
import { useEffect, useRef } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LogBox, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../styles/theme';
import { BrandLoader } from '../components/common/BrandLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { session, loading, hasProfile } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const lastTargetRef = useRef<string | null>(null);
  const splashHiddenRef = useRef(false);

  useEffect(() => {
    // Only navigate once root navigation container is mounted and auth has finished loading
    if (!navigationState?.key || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    let target: string | null = null;
    if (!session) {
      if (!inAuthGroup) target = '/(auth)/login';
    } else if (!hasProfile) {
      if (!inOnboarding) target = '/onboarding';
    } else {
      if (inAuthGroup || inOnboarding) {
        target = '/(tabs)';
      }
    }

    if (target && target !== lastTargetRef.current) {
      lastTargetRef.current = target;
      router.replace(target as any);
    }

    // Dismiss splash screen only once auth is resolved and initial route is dispatched
    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [session, loading, hasProfile, segments, navigationState?.key]);

  // Render Stack with consistent theme background to eliminate dark frame flashes
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  // Fallback safety timer: ensure splash never stays permanently locked if network stalls
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded && !error) {
    return <BrandLoader fullScreen size="lg" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
