process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.EXPO_PUBLIC_USE_MOCK_AUTH = 'true';
process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = 'mock-places-key';

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

