import { supabase } from './supabase';
import * as Location from 'expo-location';

export interface ParsedPlanResult {
  title: string;
  venue: string;
  tags: string[];
  capacity: string;
  scheduledAt?: Date;
  latitude?: number;
  longitude?: number;
  embedding?: number[];
  source: 'ai' | 'local';
  success: boolean;
}

/**
 * Intelligent natural language parser for dates and times.
 * Handles "tomorrow 6pm", "this saturday at 10:30am", "tonight 8pm", "friday morning", etc.
 */
function extractScheduledDate(text: string): Date | undefined {
  const now = new Date();
  let targetDate = new Date();
  let dateFound = false;

  const lower = text.toLowerCase();

  // 1. Check relative day keywords
  if (lower.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
    dateFound = true;
  } else if (lower.includes('today') || lower.includes('tonight')) {
    dateFound = true;
  } else {
    // 2. Check days of the week
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      if (lower.includes(dayName)) {
        const currentDay = now.getDay();
        let daysUntil = (dayIndex - currentDay + 7) % 7;
        if (daysUntil === 0) daysUntil = 7; // Next occurrence
        targetDate.setDate(now.getDate() + daysUntil);
        dateFound = true;
        break;
      }
    }
  }

  // 3. Extract Time
  let hours = 18; // Default 6:00 PM if unspecified
  let minutes = 0;
  let timeFound = false;

  // Regex for "6pm", "6:30pm", "6 pm", "10am", "10:15 am", "18:00"
  const time12Match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const time24Match = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);

  if (time12Match) {
    let parsedHours = parseInt(time12Match[1], 10);
    const parsedMinutes = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const isPm = time12Match[3].toLowerCase() === 'pm';

    if (isPm && parsedHours < 12) parsedHours += 12;
    if (!isPm && parsedHours === 12) parsedHours = 0;

    hours = parsedHours;
    minutes = parsedMinutes;
    timeFound = true;
  } else if (time24Match) {
    hours = parseInt(time24Match[1], 10);
    minutes = parseInt(time24Match[2], 10);
    timeFound = true;
  } else if (lower.includes('morning')) {
    hours = 9;
    minutes = 0;
    timeFound = true;
  } else if (lower.includes('afternoon')) {
    hours = 14;
    minutes = 0;
    timeFound = true;
  } else if (lower.includes('evening')) {
    hours = 18;
    minutes = 0;
    timeFound = true;
  } else if (lower.includes('tonight') || lower.includes('night')) {
    hours = 20;
    minutes = 0;
    timeFound = true;
  }

  if (dateFound || timeFound) {
    targetDate.setHours(hours, minutes, 0, 0);
    // If calculated time is already in the past today, push to tomorrow
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    return targetDate;
  }

  return undefined;
}

/**
 * Hybrid AI & Local NLP Plan Parser.
 * 1. Tries Supabase Edge Function (OpenAI GPT-4o-mini).
 * 2. If Edge Function fails or lacks quota, smoothly falls back to our robust local NLP & Geocoding engine.
 */
export async function parsePlanWithAI(prompt: string): Promise<ParsedPlanResult> {
  const text = prompt.toLowerCase().trim();

  if (!text) {
    return {
      title: '',
      venue: '',
      tags: [],
      capacity: '4',
      source: 'local',
      success: false,
    };
  }

  // 1. Attempt Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('parse-plan-text', {
      body: { prompt },
    });

    if (!error && data && data.success !== false) {
      let parsedDate: Date | undefined;
      if (data.scheduled_at) {
        parsedDate = new Date(data.scheduled_at);
      } else {
        parsedDate = extractScheduledDate(prompt);
      }

      return {
        title: data.title || 'Group Hangout',
        venue: data.venue || '',
        tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : ['social'],
        capacity: data.capacity ? String(data.capacity) : '4',
        scheduledAt: parsedDate,
        latitude: data.latitude,
        longitude: data.longitude,
        embedding: data.embedding,
        source: 'ai',
        success: true,
      };
    }
  } catch (err: any) {
    console.warn('AI Edge Function unavailable, running local NLP parser:', err.message);
  }

  // 2. Local NLP Fallback Engine
  // Simulate rapid natural intelligence feel
  await new Promise((res) => setTimeout(res, 350));

  // A. Category detection
  let tags = ['social'];
  let category = 'other';
  if (
    text.includes('run') ||
    text.includes('yoga') ||
    text.includes('gym') ||
    text.includes('workout') ||
    text.includes('fitness') ||
    text.includes('badminton') ||
    text.includes('football') ||
    text.includes('tennis') ||
    text.includes('pickleball') ||
    text.includes('swim')
  ) {
    tags = ['fitness', 'active'];
    category = 'fitness';
  } else if (
    text.includes('coffee') ||
    text.includes('cafe') ||
    text.includes('matcha') ||
    text.includes('latte') ||
    text.includes('work') ||
    text.includes('study')
  ) {
    tags = ['coffee', 'networking', 'chill'];
    category = 'coffee';
  } else if (
    text.includes('photo') ||
    text.includes('art') ||
    text.includes('museum') ||
    text.includes('gallery') ||
    text.includes('paint') ||
    text.includes('pottery')
  ) {
    tags = ['art', 'culture'];
    category = 'art';
  } else if (
    text.includes('food') ||
    text.includes('dinner') ||
    text.includes('lunch') ||
    text.includes('brunch') ||
    text.includes('ramen') ||
    text.includes('pizza') ||
    text.includes('eat') ||
    text.includes('burger')
  ) {
    tags = ['food', 'catchup'];
    category = 'food';
  } else if (
    text.includes('beer') ||
    text.includes('drinks') ||
    text.includes('cocktail') ||
    text.includes('pub') ||
    text.includes('brewery')
  ) {
    tags = ['drinks', 'social'];
    category = 'drinks';
  } else if (
    text.includes('hike') ||
    text.includes('trail') ||
    text.includes('walk') ||
    text.includes('park') ||
    text.includes('nature')
  ) {
    tags = ['hiking', 'outdoors'];
    category = 'hiking';
  }

  // B. Capacity extraction
  let capacity = '4';
  const numMatch =
    text.match(/for\s+(\d+)\s*(people|person|pax|members|friends)?/) ||
    text.match(/(\d+)\s*(people|person|pax|members|friends)/) ||
    text.match(/with\s+(\d+)/);
  if (numMatch && numMatch[1]) {
    const parsedNum = Math.min(20, Math.max(2, parseInt(numMatch[1], 10)));
    capacity = String(parsedNum);
  }

  // C. Title extraction
  let title = 'Group Hangout';
  if (category === 'fitness') {
    if (text.includes('badminton')) title = 'Badminton Match';
    else if (text.includes('run')) title = 'Morning Run & Workout';
    else if (text.includes('tennis')) title = 'Tennis Rally';
    else if (text.includes('pickleball')) title = 'Pickleball Game';
    else title = 'Fitness Session';
  } else if (category === 'coffee') {
    title = 'Coffee & Co-working';
  } else if (category === 'art') {
    title = 'Art Gallery Walk';
  } else if (category === 'food') {
    if (text.includes('brunch')) title = 'Weekend Brunch';
    else if (text.includes('dinner')) title = 'Dinner Catchup';
    else title = 'Food & Catchup';
  } else if (category === 'drinks') {
    title = 'Evening Drinks & Chill';
  } else if (category === 'hiking') {
    title = 'Nature Trail Walk';
  }

  // Capitalize if user entered a short custom title
  if (prompt.length > 5 && prompt.length < 32 && !text.includes('for') && !text.includes('at')) {
    title = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  }

  // D. Venue extraction
  let venue = '';
  const atMatch = text.match(/at\s+([^,.\n\t]+)/i) || text.match(/in\s+([^,.\n\t]+)/i);
  if (atMatch && atMatch[1]) {
    const cleanVenue = atMatch[1]
      .replace(
        /(tomorrow|today|tonight|this|next|saturday|sunday|monday|tuesday|wednesday|thursday|friday|\d+pm|\d+am|\d+\s*o'clock|for\s+\d+).*/i,
        ''
      )
      .trim();
    if (cleanVenue.length > 1) {
      venue = cleanVenue
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // E. Date & Time extraction
  const scheduledAt = extractScheduledDate(prompt);

  // F. Forward Geocoding
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (venue) {
    try {
      const geoResults = await Location.geocodeAsync(venue);
      if (geoResults && geoResults.length > 0) {
        latitude = geoResults[0].latitude;
        longitude = geoResults[0].longitude;
      }
    } catch {
      // Graceful fallback to default/user coordinates if geocode is silent
    }
  }

  return {
    title,
    venue: venue || 'City Center',
    tags,
    capacity,
    scheduledAt,
    latitude,
    longitude,
    source: 'local',
    success: true,
  };
}
