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
        const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId && projectId !== 'along-project' ? { projectId } : undefined
        );
        return tokenResponse.data;
      } catch (tokenErr) {
        console.warn('Could not fetch Expo push token (expected in Expo Go without EAS ID):', tokenErr);
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

/**
 * Triggers a local notification alert when someone joins a plan or sends a message.
 */
export function sendPlanActivityNotification(payload: NotificationPayload) {
  console.log(`[Push Notification] Triggered: ${payload.title} - ${payload.body}`);
  if (Platform.OS === 'web') {
    // In web preview mode, show alert banner
    return;
  }
  Alert.alert(`🔔 ${payload.title}`, payload.body);
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
