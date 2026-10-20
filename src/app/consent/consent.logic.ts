/** The two choices a user can store in the consent key. */
export type ConsentChoice = 'accept' | 'reject';

/**
 * Reads a stored consent value; anything corrupt, unreadable, empty or
 * outside the expected values counts as no choice (RF-7, CL-1).
 */
export function parseConsent(raw: string | null): ConsentChoice | null {
  if (raw === 'accept' || raw === 'reject') {
    return raw;
  }
  return null;
}

/** Persistence is allowed only with an explicit acceptance (RF-2/RF-3/RF-5). */
export function canPersist(choice: ConsentChoice | null): boolean {
  return choice === 'accept';
}
