import { calculateDistance } from '../src/lib/geoUtils';

describe('geoUtils', () => {
  it('calculates the correct distance between two points', () => {
    // New York (40.7128, -74.0060) to Los Angeles (34.0522, -118.2437)
    // Approximate distance is ~3936 km
    const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it('returns 0 for the exact same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });
});
