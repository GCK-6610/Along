import { Plan } from '../types';

export type DateFilterPreset = 'all' | 'today' | 'tomorrow' | 'weekend' | 'upcoming';

export interface DateFilterOption {
  id: DateFilterPreset;
  label: string;
  emoji: string;
}

export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'today', label: 'Today', emoji: '⚡' },
  { id: 'tomorrow', label: 'Tomorrow', emoji: '🌅' },
  { id: 'weekend', label: 'This Weekend', emoji: '🏕️' },
  { id: 'upcoming', label: 'Upcoming', emoji: '📆' },
];

/**
 * Filters a list of plans according to a selected date/time preset.
 * All boundary checks are performed using local device time.
 */
export function filterPlansByDate(
  plans: Plan[],
  preset: DateFilterPreset,
  now: Date = new Date()
): Plan[] {
  if (preset === 'all') return plans;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999).getTime();

  // Day of week: 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const currentDayOfWeek = now.getDay();
  let weekendStartMs: number;
  let weekendEndMs: number;

  if (currentDayOfWeek === 5) {
    // Friday: weekend starts today at 17:00 (or right now if later)
    weekendStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0, 0).getTime();
    weekendEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 23, 59, 59, 999).getTime();
  } else if (currentDayOfWeek === 6) {
    // Saturday: weekend is today + tomorrow (Sunday)
    weekendStartMs = startOfToday;
    weekendEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999).getTime();
  } else if (currentDayOfWeek === 0) {
    // Sunday: weekend is today through end of Sunday
    weekendStartMs = startOfToday;
    weekendEndMs = endOfToday;
  } else {
    // Mon-Thu: calculate upcoming Friday 17:00 through Sunday 23:59:59
    const daysUntilFriday = 5 - currentDayOfWeek;
    weekendStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday, 17, 0, 0, 0).getTime();
    weekendEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday + 2, 23, 59, 59, 999).getTime();
  }

  // 4-hour active hangout grace window
  const fourHoursAgoMs = now.getTime() - 4 * 3600 * 1000;

  return plans.filter((plan) => {
    if (!plan.scheduled_at) {
      // If a plan has no scheduled_at, treat as ongoing/today
      return preset === 'today';
    }

    const planTimeMs = new Date(plan.scheduled_at).getTime();
    if (isNaN(planTimeMs)) return false;

    switch (preset) {
      case 'today':
        // Includes plans scheduled for today, or ongoing plans within the 4h grace window
        return (planTimeMs >= startOfToday && planTimeMs <= endOfToday) || (planTimeMs >= fourHoursAgoMs && planTimeMs < startOfToday);

      case 'tomorrow':
        return planTimeMs >= startOfTomorrow && planTimeMs <= endOfTomorrow;

      case 'weekend':
        return planTimeMs >= weekendStartMs && planTimeMs <= weekendEndMs;

      case 'upcoming':
        // Any plan scheduled after tomorrow
        return planTimeMs > endOfTomorrow;

      default:
        return true;
    }
  });
}
