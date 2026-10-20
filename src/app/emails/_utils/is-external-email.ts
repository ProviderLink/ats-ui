import type { Email } from '@/store/types';

/** Context type given to mail from/to someone we booked an external meeting with. */
export const EXTERNAL_EMAIL_CONTEXT = 'external_meeting';

export function isExternalEmail(email: Email): boolean {
  return email.context?.type === EXTERNAL_EMAIL_CONTEXT;
}
