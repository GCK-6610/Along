export interface Profile {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
}

export interface PlanParticipant extends Profile {
  join_status?: 'pending' | 'approved' | 'rejected';
  intro_message?: string;
}

export interface Plan {
  id: string;
  host_id: string;
  host?: Profile;
  title: string;
  tags: string[];
  description?: string;
  venue: string;
  scheduled_at: string;
  capacity: number;
  current_participants: number;
  gender_reach: 'all' | 'same';
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  participants_list?: PlanParticipant[];
  status: 'active' | 'cancelled' | 'completed';
}
