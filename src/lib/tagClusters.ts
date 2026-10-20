import { Hotspot } from '../types';

export interface ActivityClusterItem {
  id: string;
  label: string;
  emoji: string;
}

export const ACTIVITY_CLUSTERS: ActivityClusterItem[] = [
  { id: 'all', label: 'All Plans', emoji: '✨' },
  { id: 'active', label: 'Sports & Active', emoji: '🏃' },
  { id: 'cafes', label: 'Bites & Cafes', emoji: '🍜' },
  { id: 'creative', label: 'Creative & Arts', emoji: '🎨' },
  { id: 'outdoors', label: 'Outdoors & Nature', emoji: '🌿' },
  { id: 'games', label: 'Games & Hobbies', emoji: '🎲' },
  { id: 'tech', label: 'Co-work & Tech', emoji: '💼' },
];

export const TAG_CLUSTERS: Record<string, string[]> = {
  active: [
    'active', 'fitness', 'gym', 'workout', 'run', 'running', 'jog', 'jogging',
    'marathon', 'badminton', 'padel', 'pickleball', 'tennis', 'yoga', 'pilates',
    'cycling', 'cycle', 'biking', 'sports', 'football', 'cricket', 'swimming',
    'swim', 'bouldering', 'climbing', 'boxing', 'squash', 'volleyball', 'basketball',
    'skating', 'crossfit', 'hiit', 'athletics'
  ],
  cafes: [
    'cafes', 'cafe', 'bites', 'coffee', 'tea', 'chai', 'roastery', 'brew', 'espresso',
    'matcha', 'bakery', 'boba', 'brunch', 'breakfast', 'lunch', 'dinner', 'food',
    'foodie', 'pizza', 'burger', 'sushi', 'bbq', 'ramen', 'dessert', 'icecream',
    'dining', 'streetfood', 'cooking', 'drinks', 'cocktails', 'brewery', 'beer',
    'pub', 'wine', 'bar', 'supper', 'snacks', 'tasting'
  ],
  creative: [
    'creative', 'art', 'arts', 'painting', 'paint', 'drawing', 'draw', 'sketch',
    'sketching', 'pottery', 'ceramics', 'craft', 'crafts', 'crafting', 'museum',
    'gallery', 'photography', 'photo', 'design', 'theatre', 'theater', 'exhibition',
    'writing', 'culture', 'music', 'concert', 'jam', 'singing', 'dance', 'film',
    'cinema', 'acting', 'sculpture'
  ],
  outdoors: [
    'outdoors', 'outdoor', 'hiking', 'hike', 'nature', 'park', 'walk', 'walking',
    'trail', 'trails', 'camping', 'camp', 'picnic', 'trek', 'trekking', 'sunrise',
    'sunset', 'beach', 'lake', 'lakeside', 'garden', 'gardens', 'backpacking',
    'forest', 'scenic', 'wildlife', 'boating', 'kayaking'
  ],
  games: [
    'games', 'game', 'hobbies', 'hobby', 'boardgames', 'boardgame', 'chess', 'catan',
    'trivia', 'quiz', 'arcade', 'gaming', 'esports', 'videogames', 'playstation',
    'nintendo', 'books', 'book', 'reading', 'bookclub', 'movie', 'movies',
    'dnd', 'cards', 'poker', 'anime', 'manga', 'puzzle', 'puzzles', 'chill',
    'hangout', 'casual', 'social', 'conversation', 'lounge'
  ],
  tech: [
    'tech', 'cowork', 'coworking', 'networking', 'business', 'startup', 'startups',
    'career', 'code', 'coding', 'programming', 'dev', 'developer', 'founders',
    'founder', 'entrepreneur', 'entrepreneurship', 'hackathon', 'workshop', 'ai',
    'web3', 'crypto', 'product', 'designers', 'freelance', 'meetup', 'study',
    'studying'
  ],
};

/**
 * Matches plan tags or title against an activity cluster category
 */
export function matchesCategory(
  planTags: string[] | undefined,
  planTitle: string,
  categoryId: string
): boolean {
  if (categoryId === 'all') return true;
  const cluster = TAG_CLUSTERS[categoryId];
  if (!cluster) return false;

  const normalizedTags = (planTags || []).map((t) => t.toLowerCase().trim());
  const titleLower = (planTitle || '').toLowerCase();

  for (const tag of normalizedTags) {
    if (tag === categoryId) return true;
    for (const kw of cluster) {
      if (tag === kw || tag.includes(kw) || kw.includes(tag)) {
        return true;
      }
    }
  }

  for (const kw of cluster) {
    if (titleLower.includes(kw)) {
      return true;
    }
  }

  return false;
}

/**
 * Matches sponsored hotspot tags, name, or description against an activity category
 */
export function matchesHotspotCategory(hotspot: Hotspot, categoryId: string): boolean {
  if (categoryId === 'all') return true;
  const cluster = TAG_CLUSTERS[categoryId];
  if (!cluster) return false;

  const hTags = (hotspot.tags || []).map((t: string) => t.toLowerCase().trim());
  const nameLower = (hotspot.name || '').toLowerCase();
  const descLower = (hotspot.description || '').toLowerCase();

  for (const t of hTags) {
    for (const kw of cluster) {
      if (t === kw || t.includes(kw) || (kw.length > 3 && kw.includes(t)) || (t.length > 3 && t.includes(kw))) {
        return true;
      }
    }
  }

  for (const kw of cluster) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(nameLower) || regex.test(descLower)) {
      return true;
    }
  }

  return false;
}

function tagToMatch(tag: string, kw: string): string {
  return tag.length > kw.length ? kw : tag;
}
