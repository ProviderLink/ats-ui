import {
  str,
  num,
  pick,
} from './format';
import type { SentenceHandler } from './scope';

/** Short label for what an outbound email was, from its template context. */
const EMAIL_KIND_TEXT: Record<string, string> = {
  offer: 'sent an offer email',
  rejection: 'sent a rejection email',
  interview: 'sent an interview email',
  follow_up: 'sent a follow-up email',
  application_confirmation: 'sent the application confirmation',
};

export const describeEmail: SentenceHandler = ({ key, metadata, unattributed, finish, impersonal }) => {
  switch (key) {
    case 'email_sent': {
      const subject = pick(metadata, 'subject');
      const kind = str(metadata['kind']);
      const text = unattributed
        ? kind === 'application_confirmation'
          ? 'application confirmation email sent'
          : 'email sent'
        : (EMAIL_KIND_TEXT[kind ?? ''] ?? 'emailed the candidate');
      return finish(text, subject ? `\u201c${subject}\u201d` : '');
    }

    case 'email_received': {
      const subject = pick(metadata, 'subject');
      const files = num(metadata['attachments']);
      const parts = [
        subject ? `\u201c${subject}\u201d` : null,
        files ? `${files} attachment${files === 1 ? '' : 's'}` : null,
      ].filter(Boolean);
      return impersonal('the candidate replied by email', parts.join(' \u00b7 '));
    }

    case 'email_bounced':
    case 'email_failed': {
      const subject = pick(metadata, 'subject');
      return impersonal(
        key === 'email_bounced' ? 'email bounced' : 'email failed to send',
        subject ? `\u201c${subject}\u201d` : ''
      );
    }
  }
  return null;
};
