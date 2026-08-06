import { Plan, Profile } from '../types';

export const MOCK_PROFILES: Record<string, Profile> = {
  'user-1': {
    id: 'user-1',
    full_name: 'Sarah Jenkins',
    gender: 'female',
    avatar_url: 'https://api.dicebear.com/7.x/micah/png?seed=Sarah&backgroundColor=F4F4F5',
    is_verified: true,
  },
  'user-2': {
    id: 'user-2',
    full_name: 'David Chen',
    gender: 'male',
    avatar_url: 'https://api.dicebear.com/7.x/micah/png?seed=David&backgroundColor=F4F4F5',
    is_verified: false,
  },
  'user-3': {
    id: 'user-3',
    full_name: 'Emma Watson',
    gender: 'female',
    avatar_url: 'https://api.dicebear.com/7.x/micah/png?seed=Emma&backgroundColor=F4F4F5',
    is_verified: true,
  }
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-1',
    host_id: 'user-1',
    host: MOCK_PROFILES['user-1'],
    title: 'Morning Yoga in the Park',
    tags: ['fitness', 'yoga', 'outdoors'],
    description: 'Start your morning with a refreshing 45-minute Vinyasa yoga session on the lawn. All levels welcome, bring your own mat!',
    venue: 'Central Park (Great Lawn)',
    distance_km: 0.8,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    capacity: 5,
    current_participants: 2,
    gender_reach: 'all',
    status: 'active',
    participants_list: [
      { ...MOCK_PROFILES['user-1'], join_status: 'approved' },
      { ...MOCK_PROFILES['user-2'], join_status: 'approved' }
    ],
  },
  {
    id: 'plan-2',
    host_id: 'user-2',
    host: MOCK_PROFILES['user-2'],
    title: 'Co-working & Coffee',
    tags: ['coffee', 'networking', 'work'],
    description: 'Getting work done together over specialty pour-overs. Great wifi, comfortable seating, and casual conversation between focus blocks.',
    venue: 'Blue Bottle Cafe',
    distance_km: 1.4,
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    capacity: 3,
    current_participants: 1,
    gender_reach: 'all',
    status: 'active',
    participants_list: [{ ...MOCK_PROFILES['user-2'], join_status: 'approved' }],
  },
  {
    id: 'plan-3',
    host_id: 'user-3',
    host: MOCK_PROFILES['user-3'],
    title: 'Weekend Bouldering',
    tags: ['fitness', 'climbing', 'active'],
    description: 'Looking for a belay partner or group to hit the climbing gym this weekend.',
    venue: 'Downtown Arts District',
    distance_km: 2.5,
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    capacity: 10,
    current_participants: 4,
    gender_reach: 'all',
    status: 'active',
    participants_list: [
      { ...MOCK_PROFILES['user-3'], join_status: 'approved' },
      { ...MOCK_PROFILES['user-1'], join_status: 'approved' },
      { ...MOCK_PROFILES['user-2'], join_status: 'approved' }
    ],
  }
];

export interface Hotspot {
  id: string;
  name: string;
  tags: string[];
  distance_km: number;
  image_url: string;
}

export const HOTSPOTS: Hotspot[] = [
  { id: 'hs-1', name: 'Blue Bottle Coffee', tags: ['cafe', 'coffee'], distance_km: 1.2, image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=60' },
  { id: 'hs-2', name: 'Central Park Lawn', tags: ['park', 'outdoors'], distance_km: 0.8, image_url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=500&q=60' },
  { id: 'hs-3', name: 'Equinox Gym', tags: ['fitness', 'gym'], distance_km: 2.1, image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60' },
];

export interface ChatMessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  is_host: boolean;
  text: string;
  timestamp: string;
  is_me: boolean;
}

const initialChatStore: Record<string, ChatMessageItem[]> = {
  'plan-1': [
    {
      id: 'msg-1',
      sender_id: 'user-1',
      sender_name: 'Sarah Jenkins',
      sender_avatar: 'https://api.dicebear.com/7.x/micah/png?seed=Sarah&backgroundColor=F4F4F5',
      is_host: true,
      text: "Hey everyone! Excited for Morning Yoga in the Park. We'll meet right near the main entrance of Central Park (Great Lawn)!",
      timestamp: '10:14 AM',
      is_me: false,
    },
    {
      id: 'msg-2',
      sender_id: 'user-2',
      sender_name: 'David Chen',
      sender_avatar: 'https://api.dicebear.com/7.x/micah/png?seed=David&backgroundColor=F4F4F5',
      is_host: false,
      text: 'Awesome! Should I bring any extra equipment or gear?',
      timestamp: '10:18 AM',
      is_me: false,
    },
    {
      id: 'msg-3',
      sender_id: 'user-1',
      sender_name: 'Sarah Jenkins',
      sender_avatar: 'https://api.dicebear.com/7.x/micah/png?seed=Sarah&backgroundColor=F4F4F5',
      is_host: true,
      text: 'Just bring your own gear and water. See you all soon! 🚀',
      timestamp: '10:22 AM',
      is_me: false,
    },
  ],
  'plan-2': [
    {
      id: 'msg-201',
      sender_id: 'user-2',
      sender_name: 'David Chen',
      sender_avatar: 'https://api.dicebear.com/7.x/micah/png?seed=David&backgroundColor=F4F4F5',
      is_host: true,
      text: "I'll grab a table by the window at Blue Bottle Cafe! ☕",
      timestamp: 'Yesterday',
      is_me: false,
    },
  ],
};

export const MOCK_CHAT_STORE = initialChatStore;

export function getPlanMessages(planId: string): ChatMessageItem[] {
  if (!MOCK_CHAT_STORE[planId]) {
    MOCK_CHAT_STORE[planId] = [];
  }
  return MOCK_CHAT_STORE[planId];
}

export function addPlanMessage(planId: string, text: string): ChatMessageItem {
  const newMsg: ChatMessageItem = {
    id: `msg-${Date.now()}`,
    sender_id: 'user-me',
    sender_name: 'You',
    is_host: false,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    is_me: true,
  };
  if (!MOCK_CHAT_STORE[planId]) {
    MOCK_CHAT_STORE[planId] = [];
  }
  MOCK_CHAT_STORE[planId].push(newMsg);
  return newMsg;
}

export function addPlan(plan: Plan) {
  MOCK_PLANS.unshift(plan);
  if (!MOCK_CHAT_STORE[plan.id]) {
    MOCK_CHAT_STORE[plan.id] = [];
  }
}

export function joinPlan(planId: string, user: Profile, introMessage: string = '') {
  const plan = MOCK_PLANS.find(p => p.id === planId);
  if (plan) {
    if (!plan.participants_list) plan.participants_list = [];
    plan.participants_list.push({
      ...user,
      join_status: 'pending',
      intro_message: introMessage
    });
    if (!MOCK_CHAT_STORE[planId]) MOCK_CHAT_STORE[planId] = [];
  }
}

export function approveJoinRequest(planId: string, userId: string) {
  const plan = MOCK_PLANS.find(p => p.id === planId);
  if (plan && plan.participants_list) {
    const p = plan.participants_list.find(u => u.id === userId);
    if (p && p.join_status === 'pending') {
      p.join_status = 'approved';
      plan.current_participants += 1;
    }
  }
}

export function rejectJoinRequest(planId: string, userId: string) {
  const plan = MOCK_PLANS.find(p => p.id === planId);
  if (plan && plan.participants_list) {
    const p = plan.participants_list.find(u => u.id === userId);
    if (p && p.join_status === 'pending') {
      p.join_status = 'rejected';
    }
  }
}

export function leavePlan(planId: string, userId: string) {
  const plan = MOCK_PLANS.find(p => p.id === planId);
  if (plan) {
    plan.current_participants -= 1;
    if (plan.participants_list) {
      plan.participants_list = plan.participants_list.filter(u => u.id !== userId);
    }
  }
}

export function updateMockProfile(userId: string, data: Partial<Profile>) {
  if (MOCK_PROFILES[userId]) {
    MOCK_PROFILES[userId] = { ...MOCK_PROFILES[userId], ...data };
  }
}
