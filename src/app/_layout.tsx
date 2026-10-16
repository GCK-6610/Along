import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LogBox } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading, hasProfile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
      
      const inAuthGroup = segments[0] === '(auth)';
      const isRoot = (segments as string[]).length === 0;

      if (!session) {
        // If not logged in and not already in auth group, go to login
        if (!inAuthGroup) router.replace('/(auth)/login');
      } else if (!hasProfile) {
        // If logged in but no profile, go to onboarding
        if (segments[0] !== 'onboarding') router.replace('/onboarding');
      } else {
        // If logged in and has profile, and we are at the root or stuck in auth screen, send to tabs
        if (isRoot || inAuthGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, loading, hasProfile, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
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

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
