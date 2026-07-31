export interface Profile {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
}

export interface Plan {
  id: string;
  host_id: string;
  host?: Profile;
  title: string;
  category: string;
  description?: string;
  venue_name: string;
  scheduled_at: string;
  max_capacity: number;
  current_participants: number;
  gender_reach: 'all' | 'same';
  status: 'active' | 'cancelled' | 'completed';
}
