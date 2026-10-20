/**
 * Centralized Google Places API service
 * Handles autocomplete and place details with in-memory caching to save API quota.
 */

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  display_name?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  latitude: number;
  longitude: number;
}

const autocompleteCache = new Map<string, PlacePrediction[]>();
const detailsCache = new Map<string, PlaceDetails>();

export function getGoogleMapsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

/**
 * Searches for places matching the query string within a country
 */
export async function searchPlaces(query: string, country = 'in'): Promise<PlacePrediction[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `${country}:${trimmed.toLowerCase()}`;
  if (autocompleteCache.has(cacheKey)) {
    return autocompleteCache.get(cacheKey)!;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}&key=${apiKey}&components=country:${country}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.predictions && Array.isArray(data.predictions)) {
      autocompleteCache.set(cacheKey, data.predictions);
      return data.predictions;
    }
    return [];
  } catch (err) {
    console.warn('Google Places autocomplete error:', err);
    return [];
  }
}

/**
 * Fetches coordinate details for a specific Google place ID
 */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!placeId) return null;

  if (detailsCache.has(placeId)) {
    return detailsCache.get(placeId)!;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.result?.geometry?.location) {
      const details: PlaceDetails = {
        place_id: placeId,
        name: data.result.name || '',
        formatted_address: data.result.formatted_address || '',
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
      };
      detailsCache.set(placeId, details);
      return details;
    }
    return null;
  } catch (err) {
    console.warn('Google Places details error:', err);
    return null;
  }
}
