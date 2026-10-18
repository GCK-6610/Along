/**
 * Utility functions for Date of Birth parsing, Age calculation, and 18+ verification.
 */

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
