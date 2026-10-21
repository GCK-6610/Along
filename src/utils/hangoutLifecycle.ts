import { Plan, PlanParticipant } from '../types';

export const HANGOUT_GRACE_PERIOD_MS = 60 * 60 * 1000; // 1-hour grace window from start time
export const AUTO_ARCHIVE_MS = 10 * 24 * 60 * 60 * 1000; // 10 days auto-archive threshold

/**
 * Checks whether the hangout start time has arrived.
 */
export function hasHangoutStarted(scheduledAt: string | Date | number, now = Date.now()): boolean {
  const time = new Date(scheduledAt).getTime();
  if (isNaN(time) || time <= 0) return false;
  return time <= now;
}

/**
 * Checks whether the hangout is within its 1-hour grace window from start time.
 * During this initial hour, members are arriving and meeting, so chat and
 * interfaces remain distraction-free without wrap-up prompts.
 */
export function isHangoutInProgress(
  scheduledAt: string | Date | number,
  status: string,
  isHost: boolean,
  now = Date.now()
): boolean {
  if (!isHost || status !== 'active') return false;
  const time = new Date(scheduledAt).getTime();
  if (isNaN(time) || time <= 0) return false;
  return time <= now && time > now - HANGOUT_GRACE_PERIOD_MS;
}

/**
 * Checks whether the host can wrap up the hangout (after the 1-hour grace window).
 */
export function canWrapUpHangout(
  scheduledAt: string | Date | number,
  status: string,
  isHost: boolean,
  now = Date.now()
): boolean {
  if (!isHost || status !== 'active') return false;
  const time = new Date(scheduledAt).getTime();
  if (isNaN(time) || time <= 0) return false;
  const isOver10Days = time < now - AUTO_ARCHIVE_MS;
  if (isOver10Days) return false;
  return time <= now - HANGOUT_GRACE_PERIOD_MS;
}

/**
 * Counts approved guest attendees excluding the host.
 */
export function getApprovedAttendeeCount(
  participantsList?: PlanParticipant[],
  hostId?: string
): number {
  if (!participantsList || !Array.isArray(participantsList)) return 0;
  return participantsList.filter(
    p => p.join_status === 'approved' && (!hostId || p.id !== hostId)
  ).length;
}

/**
 * Determines whether a plan qualifies as a successfully completed hangout on a profile.
 * - For a host: must be 'completed' and had at least one guest who was not marked absent.
 * - For a participant: must be 'completed' and this user was not marked absent.
 */
export function isVerifiedCompletedHangout(
  plan: Plan,
  userId: string
): boolean {
  if (plan.status !== 'completed') return false;

  const isHost = plan.host_id === userId;
  if (isHost) {
    const guests = (plan.participants_list || []).filter(
      p => p.join_status === 'approved' && p.id !== userId
    );
    // Cold-start / 0 joins or all flaked -> not a verified successful completed event
    if (guests.length === 0) return false;
    const hasAttended = guests.some(p => p.attendance_status === 'attended');
    const allFlaked = guests.every(p => p.attendance_status === 'absent');
    return hasAttended || !allFlaked;
  }

  // User is an attendee
  // If my_attendance_status is 'absent' -> they flaked / did not attend
  if (plan.my_attendance_status === 'absent') return false;

  // Also check within participants_list if available
  const userRecord = (plan.participants_list || []).find(p => p.id === userId);
  if (userRecord && userRecord.attendance_status === 'absent') return false;

  return true;
}
