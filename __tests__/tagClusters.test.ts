import {
  matchesCategory,
  matchesHotspotCategory,
  ACTIVITY_CLUSTERS,
  TAG_CLUSTERS,
} from '../src/lib/tagClusters';
import { Hotspot } from '../src/types';

describe('Activity Tag Clusters & Filter Matching', () => {
  it('exposes all approved cluster categories with emojis', () => {
    const ids = ACTIVITY_CLUSTERS.map((c) => c.id);
    expect(ids).toEqual(['all', 'active', 'cafes', 'creative', 'outdoors', 'games', 'tech']);
    expect(ACTIVITY_CLUSTERS.length).toBe(7);
  });

  describe('matchesCategory for Plans', () => {
    it('always matches category "all"', () => {
      expect(matchesCategory([], 'Random Hangout', 'all')).toBe(true);
      expect(matchesCategory(undefined, '', 'all')).toBe(true);
    });

    it('matches sports & active keywords in tags or title', () => {
      expect(matchesCategory(['badminton'], 'Casual Play', 'active')).toBe(true);
      expect(matchesCategory(['yoga', 'morning'], 'Sunrise Stretch', 'active')).toBe(true);
      expect(matchesCategory([], 'Weekend Marathon Training', 'active')).toBe(true);
      expect(matchesCategory(['bouldering'], 'Climb session', 'active')).toBe(true);
      expect(matchesCategory(['reading'], 'Book discussion', 'active')).toBe(false);
    });

    it('matches bites & cafes keywords in tags or title', () => {
      expect(matchesCategory(['coffee'], 'Catch up at Roastery', 'cafes')).toBe(true);
      expect(matchesCategory(['chai'], 'Irani Chai Run', 'cafes')).toBe(true);
      expect(matchesCategory(['brunch'], 'Sunday Waffles', 'cafes')).toBe(true);
      expect(matchesCategory([], 'Artisan Pizza Night', 'cafes')).toBe(true);
      expect(matchesCategory(['coding'], 'Hackathon prep', 'cafes')).toBe(false);
    });

    it('matches creative & arts keywords in tags or title', () => {
      expect(matchesCategory(['painting'], 'Weekend Canvas', 'creative')).toBe(true);
      expect(matchesCategory(['pottery'], 'Clay Workshop', 'creative')).toBe(true);
      expect(matchesCategory([], 'Live Jazz Music Jam', 'creative')).toBe(true);
      expect(matchesCategory(['running'], '5k Morning Run', 'creative')).toBe(false);
    });

    it('matches outdoors & nature keywords in tags or title', () => {
      expect(matchesCategory(['hiking'], 'Trail Walk', 'outdoors')).toBe(true);
      expect(matchesCategory(['camping'], 'Lakeside Night', 'outdoors')).toBe(true);
      expect(matchesCategory([], 'Sunset View at the Hill', 'outdoors')).toBe(true);
      expect(matchesCategory(['chess'], 'Board Game Night', 'outdoors')).toBe(false);
    });

    it('matches games & hobbies keywords in tags or title', () => {
      expect(matchesCategory(['boardgames'], 'Catan & Carcassonne', 'games')).toBe(true);
      expect(matchesCategory(['chess'], 'Blitz Tournament', 'games')).toBe(true);
      expect(matchesCategory([], 'Anime Movie Screening', 'games')).toBe(true);
      expect(matchesCategory(['badminton'], 'Racket sport', 'games')).toBe(false);
    });

    it('matches co-work & tech keywords in tags or title', () => {
      expect(matchesCategory(['tech'], 'SaaS Builders', 'tech')).toBe(true);
      expect(matchesCategory(['cowork'], 'Coffee and Code', 'tech')).toBe(true);
      expect(matchesCategory([], 'AI Founders Meetup', 'tech')).toBe(true);
      expect(matchesCategory(['pottery'], 'Clay work', 'tech')).toBe(false);
    });

    it('handles uppercase and untrimmed inputs gracefully', () => {
      expect(matchesCategory(['  COFFEE  '], 'Morning Meetup', 'cafes')).toBe(true);
      expect(matchesCategory(['HIKING'], 'Mountain Trail', 'outdoors')).toBe(true);
    });
  });

  describe('matchesHotspotCategory for Sponsored Hotspots', () => {
    const sampleHotspot: Hotspot = {
      id: 'hotspot-1',
      name: 'Roastery Coffee House',
      description: 'Artisan brew cafe with specialty roast and outdoor seating',
      latitude: 17.43,
      longitude: 78.41,
      tags: ['cafe', 'coffee', 'brews'],
    };

    it('matches category "all"', () => {
      expect(matchesHotspotCategory(sampleHotspot, 'all')).toBe(true);
    });

    it('matches cafe hotspot to cafes cluster', () => {
      expect(matchesHotspotCategory(sampleHotspot, 'cafes')).toBe(true);
    });

    it('does not match cafe hotspot to sports cluster', () => {
      expect(matchesHotspotCategory(sampleHotspot, 'active')).toBe(false);
    });

    it('matches hotspot by description keywords', () => {
      const artGalleryHotspot: Hotspot = {
        id: 'hotspot-2',
        name: 'The State Center',
        description: 'Contemporary art museum and cultural exhibition gallery',
        latitude: 17.44,
        longitude: 78.38,
        tags: [],
      };
      expect(matchesHotspotCategory(artGalleryHotspot, 'creative')).toBe(true);
      expect(matchesHotspotCategory(artGalleryHotspot, 'tech')).toBe(false);
    });
  });
});
