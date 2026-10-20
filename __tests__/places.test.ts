import { searchPlaces, fetchPlaceDetails, getGoogleMapsApiKey } from '../src/lib/places';

describe('places service', () => {
  it('resolves Google Maps API key from env variables', () => {
    expect(getGoogleMapsApiKey()).toBe('mock-places-key');
  });

  it('returns empty predictions if query is empty or whitespace', async () => {
    const results = await searchPlaces('   ');
    expect(results).toEqual([]);
  });

  it('returns null for place details if placeId is empty', async () => {
    const details = await fetchPlaceDetails('');
    expect(details).toBeNull();
  });
});
