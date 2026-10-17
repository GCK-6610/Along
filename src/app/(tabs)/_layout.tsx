import { Tabs, Redirect } from 'expo-router';
import { View, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import { Home, Compass, PlusCircle, MessageCircle, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user, session, loading, hasProfile } = useAuth();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          supabase.from('profiles').update({ push_token: token }).eq('id', user.id).then();
        }
      });
    }
  }, [user]);

  // While auth state is resolving from storage, do not render tabs
  if (loading) {
    return null;
  }

  // Guard: if not authenticated, redirect immediately to login
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Guard: if authenticated but onboarding profile not completed, redirect to onboarding
  if (!hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(28, 27, 46, 0.06)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 8,
          shadowColor: '#1C1B2E',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: focused ? theme.colors.primary : theme.colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: focused ? theme.colors.primary : theme.colors.primary + '35',
              }}
            >
              <PlusCircle size={18} color={focused ? '#FFF' : theme.colors.primary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
