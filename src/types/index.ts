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

export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating?: number;
  description?: string;
  distance_km?: number;
  tags?: string[];
  image_url?: string;
  isSearched?: boolean;
}

export interface GooglePlaceDetail {
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address?: string;
  rating?: number;
}

export interface ChatMessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  timestamp: string;
  is_me: boolean;
  is_host: boolean;
}
