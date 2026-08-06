import { supabase } from './supabase';
import { USE_MOCK_AUTH } from './localSetup';

/**
 * Calculates straight-line distance between two GPS coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Formats a distance in kilometers or meters for UI display.
 * Example: 0.4 -> "400 m away", 1.8 -> "1.8 km away"
 */
export function formatDistanceTag(distanceKm: number): string {
  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm} km away`;
}

/**
 * PostGIS Geospatial Spatial Radius Query.
 * Queries Supabase PostGIS function `get_nearby_plans` when online,
 * or returns mock distance data when running in mock mode.
 */
export async function fetchNearbyPlans(
  userLat: number = 28.6139, // Default: New Delhi
  userLng: number = 77.2090,
  radiusKm: number = 5.0
) {
  if (USE_MOCK_AUTH) {
    return {
      data: [
        { id: 'plan-1', distance_km: 0.8, formatted: '800 m away' },
        { id: 'plan-2', distance_km: 1.4, formatted: '1.4 km away' },
        { id: 'plan-3', distance_km: 2.5, formatted: '2.5 km away' },
      ],
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_nearby_plans', {
      user_lat: userLat,
      user_lng: userLng,
      radius_meters: radiusKm * 1000,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch PostGIS nearby plans' };
  }
}
