import { router } from 'expo-router';

/**
 * Safely navigates back if there is a screen in the navigation stack.
 * If opened directly via deep link or push notification (canGoBack is false),
 * falls back to the specified route (defaulting to the main tabs).
 */
export function safeBack(fallback: any = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
