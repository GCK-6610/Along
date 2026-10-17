import { calculateDistance } from '../utils/distance';

/**
 * Calculates straight-line distance between two GPS coordinates using the Haversine formula.
 * Re-exports canonical implementation from src/utils/distance.
 */
export { calculateDistance, calculateDistance as calculateHaversineDistance };

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
