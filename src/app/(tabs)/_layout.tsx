import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTotalUnreadMessages } from '../../hooks/useTotalUnreadMessages';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  const { user } = useAuth();
  const totalUnread = useTotalUnreadMessages();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          supabase.from('profiles').update({ push_token: token }).eq('id', user.id).then();
        }
      });
    }
  }, [user]);

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
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 5,
                marginTop: Platform.OS === 'ios' ? -6 : -8,
                transform: [{ scale: focused ? 1.05 : 1 }],
              }}
            >
              <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontFamily: theme.typography.fontFamily.bold,
          },
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
