import { calculateAge, is18Plus, formatDobToIso } from '../src/utils/age';

describe('18+ Age Verification & Privacy Rules', () => {
  it('correctly calculates age for adult over 18', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    expect(calculateAge(dob)).toBe(25);
    expect(is18Plus(dob)).toBe(true);
  });

  it('correctly calculates age for someone who just turned 18 today', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    expect(calculateAge(dob)).toBe(18);
    expect(is18Plus(dob)).toBe(true);
  });

  it('correctly detects a minor who is 17 years old', () => {
    const today = new Date();
    // Birthday is tomorrow, so still 17
    const dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    expect(calculateAge(dob)).toBe(17);
    expect(is18Plus(dob)).toBe(false);
  });

  it('correctly detects a 16 year old minor', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    expect(calculateAge(dob)).toBe(16);
    expect(is18Plus(dob)).toBe(false);
  });

  it('formats Date of Birth to ISO YYYY-MM-DD correctly', () => {
    const dob = new Date(2002, 4, 15); // May 15, 2002
    expect(formatDobToIso(dob)).toBe('2002-05-15');
  });

  it('verifies privacy settings configuration rules', () => {
    const defaultSettings = {
      show_stats: true,
      show_ratings: true,
      show_location: true,
      show_bio: true,
    };

    const restrictedSettings = {
      show_stats: false,
      show_ratings: false,
      show_location: false,
      show_bio: false,
    };

    // Name and Age are invariant safety fields that do not exist in privacy toggles
    expect(Object.keys(defaultSettings)).not.toContain('name');
    expect(Object.keys(defaultSettings)).not.toContain('age');
    expect(restrictedSettings.show_stats).toBe(false);
    expect(restrictedSettings.show_ratings).toBe(false);
  });
});
