export interface PrivacySettings {
  show_stats?: boolean;
  show_ratings?: boolean;
  show_location?: boolean;
  show_bio?: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
  dob?: string;
  base_location_name?: string;
  base_latitude?: number;
  base_longitude?: number;
  privacy_settings?: PrivacySettings;
  events_hosted?: number;
  events_attended?: number;
  rating_avg?: number;
  rating_count?: number;
  completed_plans?: number; // legacy column
}

export interface PlanParticipant extends Profile {
  join_status?: 'pending' | 'approved' | 'rejected';
  intro_message?: string;
  attendance_status?: 'pending' | 'attended' | 'absent';
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
  secret_location_details?: string;
  participants_list?: PlanParticipant[];
  my_attendance_status?: 'pending' | 'attended' | 'absent';
  status: 'active' | 'cancelled' | 'completed';
}

export interface Hotspot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating?: number;
  google_rating?: number;
  along_rating?: number;
  description?: string;
  perk_text?: string;
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
