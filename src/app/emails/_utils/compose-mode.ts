import { substituteTemplate } from '@/lib/email-template';
import { useEmailTemplateStore } from '@/store';
import type { Email, EmailAttachment } from '@/store/types';

export type ComposeMode =
  | { type: 'new' }
  | { type: 'reply'; email: Email }
  | { type: 'forward'; email: Email }
  | {
      type: 'prefill';
      to: string;
      subject?: string;
      body?: string;
      templateType?: string;
      context?: {
        type?: string;
        candidateId?: string;
        applicationId?: string;
        jobId?: string;
        interviewId?: string;
      };
      variables?: Record<string, string>;
    };

export interface ComposeState {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  // The id (not the type) — a type can hold several templates, so only the id
  // identifies which one was used.
  templateId: string;
  showCc: boolean;
  showBcc: boolean;
  attachments: EmailAttachment[];
}

const EMPTY_STATE: ComposeState = {
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  body: '',
  templateId: '',
  showCc: false,
  showBcc: false,
  attachments: [],
};

export function composeModeTitle(mode: ComposeMode): string {
  if (mode.type === 'reply') return 'Reply';
  if (mode.type === 'forward') return 'Forward';
  return 'New Email';
}

export function getModeSignature(mode: ComposeMode, open: boolean): string {
  if (!open) return 'closed';
  switch (mode.type) {
    case 'reply':
      return `reply:${mode.email._id}`;
    case 'forward':
      return `forward:${mode.email._id}`;
    case 'prefill':
      return `prefill:${mode.to}:${mode.subject ?? ''}:${mode.body ?? ''}:${mode.templateType ?? ''}`;
    default:
      return 'new';
  }
}

export function getInitialComposeState(
  mode: ComposeMode,
  open: boolean
): ComposeState {
  if (!open) return EMPTY_STATE;

  if (mode.type === 'reply') {
    const { email } = mode;
    return {
      ...EMPTY_STATE,
      to: email.from,
      cc: email.cc?.join(', ') ?? '',
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nOn ${email.sentAt ?? email.receivedAt}, ${email.from} wrote:\n\n${email.bodyText}`,
      showCc: !!email.cc?.length,
    };
  }

  if (mode.type === 'forward') {
    const { email } = mode;
    return {
      ...EMPTY_STATE,
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---\n---------- Forwarded message ----------\nFrom: ${email.from}\nDate: ${email.sentAt ?? email.receivedAt}\nSubject: ${email.subject}\nTo: ${email.to.join(', ')}\n\n${email.bodyText}`,
      // Forwarding inherits the original message's attachments by reference.
      attachments: email.attachments ?? [],
    };
  }

  if (mode.type === 'prefill') {
    // Prefill carries no explicit template choice, so fall back to the default
    // (first active) template of the requested type — and remember its id so
    // the email is logged against the template it actually used.
    const templates = useEmailTemplateStore.getState().items;
    const tmpl = mode.templateType
      ? templates.find(t => t.type === mode.templateType && t.isActive)
      : undefined;
    return {
      ...EMPTY_STATE,
      to: mode.to,
      templateId: tmpl?._id ?? '',
      subject: substituteTemplate(
        mode.subject || tmpl?.subject || '',
        mode.variables
      ),
      body: substituteTemplate(mode.body || tmpl?.bodyText || '', mode.variables),
    };
  }

  return EMPTY_STATE;
}
