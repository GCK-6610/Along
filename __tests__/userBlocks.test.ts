import { filterPlansByBlockedUsers } from '../src/utils/blockFilters';
import { Plan } from '../src/types';

describe('userBlocks', () => {
  const samplePlans: Plan[] = [
    {
      id: 'plan-1',
      host_id: 'user-a',
      title: 'Morning Run in Lodhi Garden',
      tags: ['fitness'],
      venue: 'Lodhi Garden Gate 1',
      scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      capacity: 4,
      current_participants: 1,
      gender_reach: 'all',
      status: 'active',
    },
    {
      id: 'plan-2',
      host_id: 'user-b',
      title: 'Espresso Tasting at Blue Tokai',
      tags: ['coffee'],
      venue: 'Blue Tokai Cafe',
      scheduled_at: new Date(Date.now() + 7200000).toISOString(),
      capacity: 3,
      current_participants: 2,
      gender_reach: 'all',
      status: 'active',
    },
    {
      id: 'plan-3',
      host_id: 'user-c',
      title: 'Badminton Doubles Match',
      tags: ['badminton'],
      venue: 'Siri Fort Sports Complex',
      scheduled_at: new Date(Date.now() + 10800000).toISOString(),
      capacity: 4,
      current_participants: 3,
      gender_reach: 'all',
      status: 'active',
    },
  ];

  it('returns empty array when plans list is empty', () => {
    const blocked = new Set(['user-b']);
    expect(filterPlansByBlockedUsers([], blocked)).toEqual([]);
  });

  it('returns all plans when blocked users set is empty', () => {
    const emptyBlocked = new Set<string>();
    const result = filterPlansByBlockedUsers(samplePlans, emptyBlocked);
    expect(result).toHaveLength(3);
    expect(result.map(p => p.id)).toEqual(['plan-1', 'plan-2', 'plan-3']);
  });

  it('filters out plans hosted by a blocked user', () => {
    const blocked = new Set(['user-b']);
    const result = filterPlansByBlockedUsers(samplePlans, blocked);
    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['plan-1', 'plan-3']);
  });

  it('filters out plans hosted by multiple blocked users', () => {
    const blocked = new Set(['user-a', 'user-c']);
    const result = filterPlansByBlockedUsers(samplePlans, blocked);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('plan-2');
  });

  it('returns empty array when all hosts are blocked', () => {
    const blocked = new Set(['user-a', 'user-b', 'user-c']);
    const result = filterPlansByBlockedUsers(samplePlans, blocked);
    expect(result).toHaveLength(0);
  });
});
