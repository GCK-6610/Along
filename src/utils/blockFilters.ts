import { Plan } from '../types';

/**
 * Filters out hangouts hosted by any blocked user.
 * Guarantees that users never see plans created by members they have blocked.
 */
export function filterPlansByBlockedUsers(plans: Plan[], blockedUserIds: Set<string>): Plan[] {
  if (!plans || plans.length === 0) return [];
  if (!blockedUserIds || blockedUserIds.size === 0) return plans;
  return plans.filter(p => !blockedUserIds.has(p.host_id));
}
