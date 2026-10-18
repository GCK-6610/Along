import { getUserFriendlyErrorMessage } from '../src/utils/errorHandling';

describe('getUserFriendlyErrorMessage', () => {
  it('returns fallback for null or empty input', () => {
    expect(getUserFriendlyErrorMessage(null)).toBe('Something went wrong. Please try again in a moment.');
    expect(getUserFriendlyErrorMessage('')).toBe('Something went wrong. Please try again in a moment.');
  });

  it('sanitizes AI credit / quota / 429 exceptions', () => {
    const error = { message: 'OpenAI vision verification failed (429): You exceeded your current quota' };
    expect(getUserFriendlyErrorMessage(error)).toBe('This service is momentarily busy. Please try again in a little while.');
  });

  it('sanitizes database constraint and Postgres errors', () => {
    const error = { message: 'null value in column "full_name" violates not-null constraint' };
    expect(getUserFriendlyErrorMessage(error)).toBe('Something went wrong on our end. Please try again in a moment.');
  });

  it('sanitizes 500 internal server and API URL exceptions', () => {
    const error = { message: 'AuthApiError: Internal Server Error (500) at https://bahmgqxuxuohaaubrvui.supabase.co/auth/v1/otp' };
    expect(getUserFriendlyErrorMessage(error)).toBe('Something went wrong on our end. Please try again in a moment.');
  });

  it('sanitizes network connectivity failures', () => {
    const error = new Error('Network request failed');
    expect(getUserFriendlyErrorMessage(error)).toBe('Unable to connect. Please check your internet connection and try again.');
  });

  it('preserves user-facing validation messages', () => {
    const error = { message: 'Please enter a valid 10-digit mobile number.' };
    expect(getUserFriendlyErrorMessage(error)).toBe('Please enter a valid 10-digit mobile number.');
  });
});
