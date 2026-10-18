import type { ComposeMode } from '@/app/emails/_utils/compose-mode';
import type { ClientContact } from '@/store/types';

export function buildContactComposeMode(
  contact: ClientContact | null
): ComposeMode {
  if (!contact) return { type: 'new' };
  return {
    type: 'prefill',
    to: contact.email,
    subject: '',
    body: '',
    templateType: 'general',
    context: { type: 'general' },
    variables: {
      candidateName: contact.name,
      candidateEmail: contact.email,
      candidatePhone: contact.phone ?? '',
      jobTitle: '',
      clientName: '',
      currentStage: '',
      companyName: '',
      senderName: '',
    },
  };
}
