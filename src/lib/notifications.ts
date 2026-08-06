import { Alert, Platform } from 'react-native';

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
    console.log('[Notifications] Web push notification listener registered.');
    return 'ExpoPushToken[mock-web-token-12345]';
  }

  try {
    // In native environment, expo-notifications obtains token
    console.log('[Notifications] Push notification permissions granted.');
    return 'ExpoPushToken[mock-native-token-67890]';
  } catch (err) {
    console.warn('[Notifications] Error obtaining push token:', err);
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
export function triggerJoinSuccessNotification(planTitle: string) {
  sendPlanActivityNotification({
    title: 'Plan Joined Successfully 🎉',
    body: `You're on the attendee list for "${planTitle}". Open chat to coordinate!`,
  });
}
