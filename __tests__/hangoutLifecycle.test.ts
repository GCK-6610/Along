import {
  hasHangoutStarted,
  isHangoutInProgress,
  canWrapUpHangout,
  getApprovedAttendeeCount,
  isVerifiedCompletedHangout,
  HANGOUT_GRACE_PERIOD_MS,
  AUTO_ARCHIVE_MS,
} from '../src/utils/hangoutLifecycle';
import { Plan, PlanParticipant } from '../src/types';

describe('hangoutLifecycle', () => {
  const now = 1700000000000; // Fixed timestamp reference

  describe('hasHangoutStarted', () => {
    it('returns false for future scheduled dates', () => {
      const future = new Date(now + 10 * 60 * 1000).toISOString();
      expect(hasHangoutStarted(future, now)).toBe(false);
    });

    it('returns true when start time matches or has passed', () => {
      const past = new Date(now - 5 * 60 * 1000).toISOString();
      expect(hasHangoutStarted(past, now)).toBe(true);
    });

    it('returns false for invalid date strings', () => {
      expect(hasHangoutStarted('invalid-date', now)).toBe(false);
    });
  });

  describe('isHangoutInProgress', () => {
    it('returns true during the 1-hour grace window for host on active plans', () => {
      const started30MinsAgo = new Date(now - 30 * 60 * 1000).toISOString();
      expect(isHangoutInProgress(started30MinsAgo, 'active', true, now)).toBe(true);
    });

    it('returns false before start time', () => {
      const inFuture = new Date(now + 10 * 60 * 1000).toISOString();
      expect(isHangoutInProgress(inFuture, 'active', true, now)).toBe(false);
    });

    it('returns false after 60 minutes have elapsed', () => {
      const started75MinsAgo = new Date(now - 75 * 60 * 1000).toISOString();
      expect(isHangoutInProgress(started75MinsAgo, 'active', true, now)).toBe(false);
    });

    it('returns false for non-hosts or non-active plans', () => {
      const started30MinsAgo = new Date(now - 30 * 60 * 1000).toISOString();
      expect(isHangoutInProgress(started30MinsAgo, 'active', false, now)).toBe(false);
      expect(isHangoutInProgress(started30MinsAgo, 'completed', true, now)).toBe(false);
      expect(isHangoutInProgress(started30MinsAgo, 'cancelled', true, now)).toBe(false);
    });
  });

  describe('canWrapUpHangout', () => {
    it('returns true for host after the 1-hour grace period on active plans', () => {
      const started90MinsAgo = new Date(now - 90 * 60 * 1000).toISOString();
      expect(canWrapUpHangout(started90MinsAgo, 'active', true, now)).toBe(true);
    });

    it('returns false during the first hour of hangout', () => {
      const started45MinsAgo = new Date(now - 45 * 60 * 1000).toISOString();
      expect(canWrapUpHangout(started45MinsAgo, 'active', true, now)).toBe(false);
    });

    it('returns false if hangout is older than 10 days (auto-archived)', () => {
      const olderThan10Days = new Date(now - (AUTO_ARCHIVE_MS + 1000)).toISOString();
      expect(canWrapUpHangout(olderThan10Days, 'active', true, now)).toBe(false);
    });

    it('returns false for non-hosts or non-active plans', () => {
      const started90MinsAgo = new Date(now - 90 * 60 * 1000).toISOString();
      expect(canWrapUpHangout(started90MinsAgo, 'active', false, now)).toBe(false);
      expect(canWrapUpHangout(started90MinsAgo, 'completed', true, now)).toBe(false);
      expect(canWrapUpHangout(started90MinsAgo, 'cancelled', true, now)).toBe(false);
    });
  });

  describe('getApprovedAttendeeCount', () => {
    const hostId = 'host-123';

    it('returns 0 when participants list is empty or undefined', () => {
      expect(getApprovedAttendeeCount(undefined, hostId)).toBe(0);
      expect(getApprovedAttendeeCount([], hostId)).toBe(0);
    });

    it('counts only approved guests and excludes host', () => {
      const participants: PlanParticipant[] = [
        { id: hostId, full_name: 'Host', is_verified: true, gender: 'male', join_status: 'approved' },
        { id: 'user-2', full_name: 'Alice', is_verified: true, gender: 'female', join_status: 'approved' },
        { id: 'user-3', full_name: 'Bob', is_verified: false, gender: 'male', join_status: 'pending' },
        { id: 'user-4', full_name: 'Charlie', is_verified: true, gender: 'male', join_status: 'approved' },
      ];
      expect(getApprovedAttendeeCount(participants, hostId)).toBe(2);
    });

    it('handles 0 attendees properly when no one joined', () => {
      const participants: PlanParticipant[] = [
        { id: hostId, full_name: 'Host', is_verified: true, gender: 'male', join_status: 'approved' },
      ];
      expect(getApprovedAttendeeCount(participants, hostId)).toBe(0);
    });
  });

  describe('isVerifiedCompletedHangout', () => {
    const hostId = 'host-1';
    const attendeeId = 'user-2';

    const basePlan: Plan = {
      id: 'plan-1',
      host_id: hostId,
      title: 'Coffee at Blue Tokai',
      tags: ['coffee'],
      venue: 'Blue Tokai',
      scheduled_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      capacity: 4,
      current_participants: 2,
      gender_reach: 'all',
      status: 'completed',
    };

    describe('for host', () => {
      it('returns true when at least one guest was approved and attended', () => {
        const plan: Plan = {
          ...basePlan,
          participants_list: [
            { id: attendeeId, full_name: 'Alice', is_verified: true, gender: 'female', join_status: 'approved', attendance_status: 'attended' },
          ],
        };
        expect(isVerifiedCompletedHangout(plan, hostId)).toBe(true);
      });

      it('returns false when 0 attendees joined (cold start)', () => {
        const plan: Plan = {
          ...basePlan,
          participants_list: [],
        };
        expect(isVerifiedCompletedHangout(plan, hostId)).toBe(false);
      });

      it('returns false when all joined attendees were marked absent (flaked)', () => {
        const plan: Plan = {
          ...basePlan,
          participants_list: [
            { id: attendeeId, full_name: 'Alice', is_verified: true, gender: 'female', join_status: 'approved', attendance_status: 'absent' },
          ],
        };
        expect(isVerifiedCompletedHangout(plan, hostId)).toBe(false);
      });

      it('returns false if plan status is active or cancelled', () => {
        const activePlan: Plan = { ...basePlan, status: 'active' };
        expect(isVerifiedCompletedHangout(activePlan, hostId)).toBe(false);

        const cancelledPlan: Plan = { ...basePlan, status: 'cancelled' };
        expect(isVerifiedCompletedHangout(cancelledPlan, hostId)).toBe(false);
      });
    });

    describe('for attendee', () => {
      it('returns true when attendee successfully completed hangout without absence', () => {
        const plan: Plan = {
          ...basePlan,
          my_attendance_status: 'attended',
        };
        expect(isVerifiedCompletedHangout(plan, attendeeId)).toBe(true);
      });

      it('returns false when attendee was marked absent (flaked)', () => {
        const plan: Plan = {
          ...basePlan,
          my_attendance_status: 'absent',
        };
        expect(isVerifiedCompletedHangout(plan, attendeeId)).toBe(false);
      });

      it('returns false if participant record in list is absent', () => {
        const plan: Plan = {
          ...basePlan,
          participants_list: [
            { id: attendeeId, full_name: 'Alice', is_verified: true, gender: 'female', join_status: 'approved', attendance_status: 'absent' },
          ],
        };
        expect(isVerifiedCompletedHangout(plan, attendeeId)).toBe(false);
      });
    });
  });
});
