/**
 * Sanitizes technical exceptions, database errors, and vendor API failures
 * into friendly, reassuring user-facing messages.
 */
export function getUserFriendlyErrorMessage(
  error: any,
  fallback = 'Something went wrong. Please try again in a moment.'
): string {
  if (!error) return fallback;

  const rawMessage = typeof error === 'string' ? error : error?.message || '';
  if (!rawMessage || typeof rawMessage !== 'string') return fallback;

  const lower = rawMessage.toLowerCase();

  // Network / connectivity issues
  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('timeout')
  ) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // Rate limits / AI credits / Quota exceeded
  if (
    lower.includes('quota') ||
    lower.includes('credits') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('insufficient_quota')
  ) {
    return 'This service is momentarily busy. Please try again in a little while.';
  }

  // Database or backend internal errors (violates constraint, syntax, relation, 500)
  if (
    lower.includes('violates') ||
    lower.includes('constraint') ||
    lower.includes('syntax error') ||
    lower.includes('relation') ||
    lower.includes('column') ||
    lower.includes('internal server error') ||
    lower.includes('database error') ||
    lower.includes('authapierror') ||
    lower.includes('pgrst') ||
    lower.includes('500')
  ) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  // If message contains internal technical URLs or file paths
  if (lower.includes('http://') || lower.includes('https://') || lower.includes('supabase.co')) {
    return 'Something went wrong while processing your request. Please try again in a moment.';
  }

  // Legitimate validation or user-correctable messages (clean single line)
  return rawMessage.trim();
}
