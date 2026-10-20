import { filterPlansByDate, DATE_FILTER_OPTIONS } from '../src/lib/dateFilters';
import { Plan } from '../src/types';

describe('dateFilters utility', () => {
  const basePlan: Plan = {
    id: 'test-plan',
    title: 'Test Hangout',
    creator_id: 'user-1',
    category: 'fitness',
    venue: 'Central Park',
    scheduled_at: '',
    latitude: 28.6139,
    longitude: 77.209,
    created_at: new Date().toISOString(),
  };

  // Fixed reference date: Wednesday, Oct 21, 2026 at 14:00 local time
  const refDate = new Date(2026, 9, 21, 14, 0, 0);

  test('DATE_FILTER_OPTIONS contains all 5 expected presets', () => {
    expect(DATE_FILTER_OPTIONS).toHaveLength(5);
    expect(DATE_FILTER_OPTIONS.map((o) => o.id)).toEqual([
      'all',
      'today',
      'tomorrow',
      'weekend',
      'upcoming',
    ]);
  });

  test('returns all plans when preset is "all"', () => {
    const plans: Plan[] = [
      { ...basePlan, id: '1', scheduled_at: new Date(2026, 9, 21, 18, 0).toISOString() },
      { ...basePlan, id: '2', scheduled_at: new Date(2026, 9, 22, 10, 0).toISOString() },
      { ...basePlan, id: '3', scheduled_at: new Date(2026, 9, 24, 15, 0).toISOString() },
    ];
    const filtered = filterPlansByDate(plans, 'all', refDate);
    expect(filtered).toHaveLength(3);
  });

  test('filters plans correctly for "today"', () => {
    const plans: Plan[] = [
      { ...basePlan, id: 'today-plan', scheduled_at: new Date(2026, 9, 21, 18, 0).toISOString() },
      { ...basePlan, id: 'tomorrow-plan', scheduled_at: new Date(2026, 9, 22, 10, 0).toISOString() },
      { ...basePlan, id: 'yesterday-plan', scheduled_at: new Date(2026, 9, 20, 10, 0).toISOString() },
    ];
    const filtered = filterPlansByDate(plans, 'today', refDate);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('today-plan');
  });

  test('includes recent ongoing plans within 4 hour grace window for "today"', () => {
    // 2 hours ago from refDate (12:00 vs 14:00)
    const ongoingPlan: Plan = {
      ...basePlan,
      id: 'ongoing-plan',
      scheduled_at: new Date(2026, 9, 21, 12, 0).toISOString(),
    };
    const filtered = filterPlansByDate([ongoingPlan], 'today', refDate);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('ongoing-plan');
  });

  test('filters plans correctly for "tomorrow"', () => {
    const plans: Plan[] = [
      { ...basePlan, id: 'today-plan', scheduled_at: new Date(2026, 9, 21, 18, 0).toISOString() },
      { ...basePlan, id: 'tomorrow-plan', scheduled_at: new Date(2026, 9, 22, 10, 0).toISOString() },
      { ...basePlan, id: 'weekend-plan', scheduled_at: new Date(2026, 9, 24, 15, 0).toISOString() },
    ];
    const filtered = filterPlansByDate(plans, 'tomorrow', refDate);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('tomorrow-plan');
  });

  test('filters plans correctly for "weekend" from Wednesday', () => {
    // Wednesday Oct 21 -> Friday is Oct 23, Saturday is Oct 24, Sunday is Oct 25
    const plans: Plan[] = [
      { ...basePlan, id: 'thu-plan', scheduled_at: new Date(2026, 9, 22, 19, 0).toISOString() },
      { ...basePlan, id: 'fri-evening', scheduled_at: new Date(2026, 9, 23, 19, 0).toISOString() },
      { ...basePlan, id: 'sat-afternoon', scheduled_at: new Date(2026, 9, 24, 14, 0).toISOString() },
      { ...basePlan, id: 'next-mon', scheduled_at: new Date(2026, 9, 26, 9, 0).toISOString() },
    ];
    const filtered = filterPlansByDate(plans, 'weekend', refDate);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(['fri-evening', 'sat-afternoon']);
  });

  test('filters plans correctly for "upcoming"', () => {
    // Upcoming = anything after tomorrow (i.e. starting Friday Oct 23 onwards)
    const plans: Plan[] = [
      { ...basePlan, id: 'today-plan', scheduled_at: new Date(2026, 9, 21, 18, 0).toISOString() },
      { ...basePlan, id: 'tomorrow-plan', scheduled_at: new Date(2026, 9, 22, 10, 0).toISOString() },
      { ...basePlan, id: 'future-plan-1', scheduled_at: new Date(2026, 9, 24, 12, 0).toISOString() },
      { ...basePlan, id: 'future-plan-2', scheduled_at: new Date(2026, 9, 28, 12, 0).toISOString() },
    ];
    const filtered = filterPlansByDate(plans, 'upcoming', refDate);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(['future-plan-1', 'future-plan-2']);
  });
});
