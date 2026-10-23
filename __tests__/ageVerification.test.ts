import { calculateAge, is18Plus, formatDobToIso, getTimeUntil18 } from '../src/utils/age';
import { calculateFuzzyNameMatch, extractAndValidateDob, validateDocumentAuthenticity } from '../src/lib/idVerification';

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

  describe('getTimeUntil18 Countdown Calculation', () => {
    it('returns isAdult true if already 18 or older', () => {
      const ref = new Date(2026, 9, 18);
      const dob = new Date(2000, 0, 1);
      const res = getTimeUntil18(dob, ref);
      expect(res.isAdult).toBe(true);
      expect(res.totalDays).toBe(0);
    });

    it('returns cool countdown for someone turning 18 in 5 days', () => {
      const ref = new Date(2026, 9, 18);
      // Birthday is Oct 23, 2008 -> turns 18 on Oct 23, 2026 (5 days away)
      const dob = new Date(2008, 9, 23);
      const res = getTimeUntil18(dob, ref);
      expect(res.isAdult).toBe(false);
      expect(res.totalDays).toBe(5);
      expect(res.coolAlertTitle).toContain('Almost there!');
      expect(res.coolMessage).toContain('5 more days');
    });

    it('returns cool countdown for someone turning 18 in over a year', () => {
      const ref = new Date(2026, 9, 18);
      // 16 years old
      const dob = new Date(2010, 9, 18);
      const res = getTimeUntil18(dob, ref);
      expect(res.isAdult).toBe(false);
      expect(res.years).toBe(2);
      expect(res.coolAlertTitle).toContain('Hold tight, champ!');
      expect(res.coolMessage).toContain('2 years');
    });
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

  describe('Fuzzy Name Matching & Lenient DOB Verification', () => {
    it('matches exact names with 1.0 score', () => {
      const res = calculateFuzzyNameMatch('Gopal Choudhary', 'Gopal Choudhary');
      expect(res.isMatch).toBe(true);
      expect(res.score).toBe(1.0);
    });

    it('matches names when first name is identical even with initials', () => {
      const res = calculateFuzzyNameMatch('Gopal Choudhary', 'Gopal C');
      expect(res.isMatch).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(0.85);
    });

    it('tolerates minor OCR typos via 70%+ fuzzy score', () => {
      const res = calculateFuzzyNameMatch('Rohan Sharma', 'Rohan Sharman');
      expect(res.isMatch).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(0.70);
    });

    it('rejects completely distinct names below 70%', () => {
      const res = calculateFuzzyNameMatch('Alice Smith', 'Bob Jones');
      expect(res.isMatch).toBe(false);
      expect(res.score).toBeLessThan(0.70);
    });

    it('validates 18+ adult when DOB is present on ID', () => {
      const res = extractAndValidateDob('GOVERNMENT OF INDIA DOB: 14/08/1998 MALE');
      expect(res.hasDob).toBe(true);
      expect(res.isAdult).toBe(true);
      expect(res.dobString).toBe('1998-08-14');
    });

    it('detects minors when DOB is present on ID', () => {
      const res = extractAndValidateDob('STUDENT ID CARD DOB: 14/08/2014 MALE');
      expect(res.hasDob).toBe(true);
      expect(res.isAdult).toBe(false);
    });

    it('leniently allows verification when DOB is absent on document', () => {
      const res = extractAndValidateDob('GOVERNMENT OF INDIA AADHAAR CARD ROHAN SHARMA');
      expect(res.hasDob).toBe(false);
      expect(res.isAdult).toBe(true); // Lenient: does not block
    });
  });

  describe('Anti-Spoofing & Document Authenticity Validation', () => {
    it('blocks plain paper handwritten notes with name and DOB', () => {
      const plainPaper = 'Rohan Sharma DOB: 15/05/2000';
      const res = validateDocumentAuthenticity(plainPaper);
      expect(res.isValidDocument).toBe(false);
      expect(res.errorMessage).toContain('Plain paper notes or handwritten text cannot be accepted');
    });

    it('blocks random text notes or scribble attempts', () => {
      const scribble = 'My name is Gopal and I am 22 years old';
      const res = validateDocumentAuthenticity(scribble);
      expect(res.isValidDocument).toBe(false);
    });

    it('authenticates valid Aadhaar card text', () => {
      const aadhaarText = 'GOVERNMENT OF INDIA UNIQUE IDENTIFICATION AUTHORITY OF INDIA 9876 5432 1098 ROHAN SHARMA';
      const res = validateDocumentAuthenticity(aadhaarText);
      expect(res.isValidDocument).toBe(true);
      expect(res.documentType).toBe('Aadhaar Card');
    });

    it('authenticates valid PAN card text', () => {
      const panText = 'INCOME TAX DEPARTMENT GOVT OF INDIA PERMANENT ACCOUNT NUMBER ABCDE1234F';
      const res = validateDocumentAuthenticity(panText);
      expect(res.isValidDocument).toBe(true);
      expect(res.documentType).toBe('PAN Card');
    });

    it('authenticates valid Driving License text', () => {
      const dlText = 'UNION OF INDIA DRIVING LICENCE TRANSPORT DEPARTMENT DL NO DL-0420110012345';
      const res = validateDocumentAuthenticity(dlText);
      expect(res.isValidDocument).toBe(true);
      expect(res.documentType).toBe('Driving License');
    });

    it('authenticates valid Student / College ID text', () => {
      const studentText = 'NATIONAL INSTITUTE OF TECHNOLOGY STUDENT IDENTITY CARD ROLL NO: 2021CS04';
      const res = validateDocumentAuthenticity(studentText);
      expect(res.isValidDocument).toBe(true);
      expect(res.documentType).toBe('Student / College ID');
    });
  });
});
