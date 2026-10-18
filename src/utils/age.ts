/**
 * Utility functions for Date of Birth parsing, Age calculation, and 18+ verification.
 */

export interface TimeUntil18Result {
  isAdult: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  eighteenthBirthday: Date;
  countdownText: string;
  coolAlertTitle: string;
  coolMessage: string;
}

export function calculateAge(birthDateInput: Date | string): number {
  const birthDate = typeof birthDateInput === 'string' ? new Date(birthDateInput) : birthDateInput;
  if (!birthDate || isNaN(birthDate.getTime())) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function is18Plus(birthDateInput: Date | string): boolean {
  return calculateAge(birthDateInput) >= 18;
}

export function formatDobToIso(birthDate: Date): string {
  const yyyy = birthDate.getFullYear();
  const mm = String(birthDate.getMonth() + 1).padStart(2, '0');
  const dd = String(birthDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getTimeUntil18(birthDateInput: Date | string, referenceDate: Date = new Date()): TimeUntil18Result {
  const birthDate = typeof birthDateInput === 'string' ? new Date(birthDateInput) : birthDateInput;
  const eighteenthBirthday = new Date(
    birthDate.getFullYear() + 18,
    birthDate.getMonth(),
    birthDate.getDate()
  );

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(eighteenthBirthday);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const totalDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (totalDays <= 0) {
    return {
      isAdult: true,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      eighteenthBirthday,
      countdownText: "18+ and ready",
      coolAlertTitle: "Welcome Aboard! 🎉",
      coolMessage: "You are 18+ and ready to tag along on Along!",
    };
  }

  // Calculate remaining calendar years, months, days
  let years = targetDate.getFullYear() - today.getFullYear();
  let months = targetDate.getMonth() - today.getMonth();
  let days = targetDate.getDate() - today.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  let countdownText = '';
  if (years > 0 && months > 0) {
    countdownText = `${years} ${years === 1 ? 'year' : 'years'} and ${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (years > 0) {
    countdownText = `${years} ${years === 1 ? 'year' : 'years'} and ${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (months > 0) {
    countdownText = `${months} ${months === 1 ? 'month' : 'months'} and ${days} ${days === 1 ? 'day' : 'days'}`;
  } else {
    countdownText = `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  }

  const bdayFormatted = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let coolAlertTitle = 'Hold tight, champ! 🛹';
  let coolMessage = '';

  if (totalDays <= 30) {
    coolAlertTitle = 'Almost there! ⏳🛹';
    coolMessage = `You've only gotta wait ${totalDays} more ${totalDays === 1 ? 'day' : 'days'} to tag along with us!\n\nWe're saving a VIP spot for you on your 18th birthday (${bdayFormatted}). See you super soon! 🎉🎈`;
  } else if (totalDays <= 365) {
    coolAlertTitle = 'Counting down the days! 🛹';
    coolMessage = `You've gotta wait ${countdownText} (${totalDays} days) until you turn 18!\n\nAlong is an adult tag-along hangout community. Mark your calendar for ${bdayFormatted} and come join our hangouts then! 🚀`;
  } else {
    coolAlertTitle = 'Hold tight, champ! 🛹';
    coolMessage = `You've gotta wait ${countdownText} (${totalDays} days) before you can tag along with us!\n\nAlong is exclusively for 18+ hangouts. We can't wait to welcome you on your 18th birthday (${bdayFormatted})! 🎉`;
  }

  return {
    isAdult: false,
    years,
    months,
    days,
    totalDays,
    eighteenthBirthday,
    countdownText,
    coolAlertTitle,
    coolMessage,
  };
}
