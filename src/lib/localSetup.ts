// src/lib/localSetup.ts
// Centralised place for development‑only configuration (e.g., mock services, feature flags).
// This file is imported by production modules but only activates its mocks when the app is running in a development environment.

// Toggle mock authentication via environment variable. In Expo you can set this in a .env file
// or pass it when running `npx expo start`.
export const USE_MOCK_AUTH = __DEV__ && (process.env.EXPO_PUBLIC_USE_MOCK_AUTH !== 'false');

let currentSession: any = null;
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const stored = window.localStorage.getItem('along_mock_session');
    if (stored) currentSession = JSON.parse(stored);
  } catch (e) {}
}

const persistSession = (session: any) => {
  currentSession = session;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (session) {
      window.localStorage.setItem('along_mock_session', JSON.stringify(session));
    } else {
      window.localStorage.removeItem('along_mock_session');
    }
  }
};

const listeners = new Set<Function>();

// Simple mock that mimics Supabase's auth API and query builder for dev mode.
export const mockAuth = {
  getSession: async () => {
    return { data: { session: currentSession }, error: null };
  },
  onAuthStateChange: (callback: Function) => {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
  signInWithOtp: async ({ phone }: { phone: string }) => {
    await new Promise((res) => setTimeout(res, 200));
    return { data: { user: { id: 'mock-user-123', phone }, session: null }, error: null };
  },
  verifyOtp: async ({ phone, token }: { phone: string; token: string }) => {
    await new Promise((res) => setTimeout(res, 200));
    const mockUser = { id: 'user-me', phone: phone || '+919876543210' };
    const newSession = { user: mockUser, access_token: 'mock-jwt-token' };
    persistSession(newSession);
    listeners.forEach((cb) => cb('SIGNED_IN', newSession));
    return { data: { session: newSession, user: mockUser }, error: null };
  },
  signOut: async () => {
    persistSession(null);
    listeners.forEach((cb) => cb('SIGNED_OUT', null));
    return { error: null };
  },
};

export const mockFrom = (table: string) => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    single: async () => ({ data: { id: 'mock-user-123', full_name: 'Rahul Sharma' }, error: null }),
    insert: async () => ({ data: { id: 'mock-user-123' }, error: null }),
    update: async () => ({ data: { id: 'mock-user-123' }, error: null }),
  };
  return builder;
};

// Export any other dev‑only utilities here.
