import { supabase } from './supabase';

export interface ParsedPlanResult {
  title: string;
  venue: string;
  tags: string[];
  capacity: string;
  embedding?: number[];
  success: boolean;
}

/**
 * Parses natural language plan text into structured plan fields.
 * Includes intelligent keyword detection & LLM payload structure.
 */
export async function parsePlanWithAI(prompt: string): Promise<ParsedPlanResult> {
  const text = prompt.toLowerCase().trim();

  if (!text) {
    return {
      title: '',
      venue: '',
      tags: [],
      capacity: '2',
      success: false,
    };
  }

  try {
    // PRODUCTION STANDARD: Call Supabase Edge Function securely instead of client-side OpenAI fetch.
    const { data, error } = await supabase.functions.invoke('parse-plan-text', {
      body: { prompt }
    });

    if (error) {
      console.warn('Edge Function parse failed, falling back to heuristic parsing:', error.message);
    } else if (data && data.success !== false) {
      return {
        title: data.title || '',
        venue: data.venue || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        capacity: data.capacity ? String(data.capacity) : '4',
        embedding: data.embedding,
        success: true
      };
    }
  } catch (err: any) {
    console.warn('Failed to call AI Edge Function:', err.message);
  }

  // Simulate network delay for AI processing if falling back
  await new Promise(res => setTimeout(res, 600));

  // 1. Category extraction
  let tags = ['social'];
  let category = 'other';
  if (text.includes('run') || text.includes('yoga') || text.includes('gym') || text.includes('workout') || text.includes('fitness') || text.includes('badminton')) {
    tags = ['fitness', 'active'];
    category = 'fitness';
  } else if (text.includes('coffee') || text.includes('cafe') || text.includes('matcha') || text.includes('latte') || text.includes('work')) {
    tags = ['coffee', 'networking', 'chill'];
    category = 'coffee';
  } else if (text.includes('photo') || text.includes('art') || text.includes('museum') || text.includes('gallery') || text.includes('paint')) {
    tags = ['art', 'culture'];
    category = 'art';
  } else if (text.includes('food') || text.includes('dinner') || text.includes('lunch') || text.includes('ramen') || text.includes('pizza') || text.includes('eat')) {
    tags = ['food', 'catchup'];
    category = 'food';
  } else if (text.includes('hike') || text.includes('trail') || text.includes('walk') || text.includes('park') || text.includes('nature')) {
    tags = ['hiking', 'outdoors'];
    category = 'hiking';
  }

  // 2. Capacity extraction
  let capacity = '4';
  const numMatch = text.match(/for\s+(\d+)\s*(people|person|pax|members)?/) || text.match(/(\d+)\s*(people|person|pax|members)/);
  if (numMatch && numMatch[1]) {
    const parsedNum = Math.min(20, Math.max(2, parseInt(numMatch[1], 10)));
    capacity = String(parsedNum);
  }

  // 3. Title extraction
  let title = 'Group Plan';
  if (category === 'fitness') title = 'Morning Run & Workout';
  else if (category === 'coffee') title = 'Co-working & Specialty Coffee';
  else if (category === 'art') title = 'Art Gallery Walk';
  else if (category === 'food') title = 'Food & Drinks Catchup';
  else if (category === 'hiking') title = 'Nature & Park Walk';

  // Capitalize first letter of raw prompt if short
  if (prompt.length > 5 && prompt.length < 35) {
    title = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  }

  // 4. Venue extraction
  let venue = 'City Center';
  const atMatch = text.match(/at\s+([^,.\n\t]+)/i) || text.match(/in\s+([^,.\n\t]+)/i);
  if (atMatch && atMatch[1]) {
    // Strip time words if included
    const cleanVenue = atMatch[1]
      .replace(/(tomorrow|today|tonight|this|next|\d+pm|\d+am|\d+\s*o'clock).*/i, '')
      .trim();
    if (cleanVenue.length > 2) {
      venue = cleanVenue.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return {
    title,
    venue,
    tags,
    capacity,
    success: true,
  };
}
