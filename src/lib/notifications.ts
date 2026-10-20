import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Registers device for Expo Push Notifications and obtains push token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token: permission not granted');
        return null;
      }
      
      try {
        const rawProjectId = process.env.EXPO_PUBLIC_PROJECT_ID;
        const isUuid = rawProjectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawProjectId);
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          isUuid ? { projectId: rawProjectId } : undefined
        );
        return tokenResponse?.data ?? null;
      } catch (tokenErr) {
        // Expected in Expo Go or without configured EAS project
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }
  } catch (err) {
    console.warn('Error registering for push notifications:', err);
    return null;
  }
}

// Configure foreground notification behavior to show native banners
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Triggers a local heads-up notification banner when an event occurs
 */
export async function sendPlanActivityNotification(payload: NotificationPayload) {
  console.log(`[Notification] Triggered: ${payload.title} - ${payload.body}`);
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${payload.title}`,
        body: payload.body,
        data: payload.data || {},
        sound: true,
      },
      trigger: null, // immediate delivery
    });
  } catch (err) {
    console.warn('Failed to dispatch local banner, falling back to Alert:', err);
    Alert.alert(`🔔 ${payload.title}`, payload.body);
  }
}

/**
 * Triggers notification when a user joins a plan.
 */
export function triggerRequestSentNotification() {
  sendPlanActivityNotification({
    title: 'Request Sent ✉️',
    body: `Your request to join the plan has been sent to the host.`,
  });
}

/**
 * Invokes the send-push-notification Edge Function to dispatch a remote push alert
 */
export async function dispatchRemotePushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!userId) return;

  try {
    const { supabase } = await import('./supabase');
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title,
        body,
        data: data || {},
      },
    });
  } catch (err) {
    console.warn('[Notification] Failed to invoke remote push function:', err);
  }
}
