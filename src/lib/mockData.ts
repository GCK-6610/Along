import { Plan, Profile } from '../types';

export const MOCK_PROFILES: Record<string, Profile> = {
  'user-1': {
    id: 'user-1',
    full_name: 'Sarah Jenkins',
    gender: 'female',
    avatar_url: 'https://i.pravatar.cc/150?u=sarah',
    is_verified: true,
  },
  'user-2': {
    id: 'user-2',
    full_name: 'David Chen',
    gender: 'male',
    avatar_url: 'https://i.pravatar.cc/150?u=david',
    is_verified: false,
  },
  'user-3': {
    id: 'user-3',
    full_name: 'Emma Watson',
    gender: 'female',
    avatar_url: 'https://i.pravatar.cc/150?u=emma',
    is_verified: true,
  }
};

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-1',
    host_id: 'user-1',
    host: MOCK_PROFILES['user-1'],
    title: 'Morning Yoga in the Park',
    category: 'fitness',
    venue_name: 'Central Park (Great Lawn)',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    max_capacity: 5,
    current_participants: 2,
    gender_reach: 'all',
    status: 'active',
  },
  {
    id: 'plan-2',
    host_id: 'user-2',
    host: MOCK_PROFILES['user-2'],
    title: 'Co-working & Coffee',
    category: 'coffee',
    venue_name: 'Blue Bottle Cafe',
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    max_capacity: 3,
    current_participants: 1,
    gender_reach: 'all',
    status: 'active',
  },
  {
    id: 'plan-3',
    host_id: 'user-3',
    host: MOCK_PROFILES['user-3'],
    title: 'Photography Walk',
    category: 'art',
    venue_name: 'Downtown Arts District',
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    max_capacity: 10,
    current_participants: 4,
    gender_reach: 'all',
    status: 'active',
  }
];
