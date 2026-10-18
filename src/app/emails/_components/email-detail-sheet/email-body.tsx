import type { Email } from '@/store/types';
import { PaperclipIcon } from 'lucide-react';
import { AttachmentItem } from './attachment-item';

export function EmailBody({ email }: { email: Email }) {
  const attachments = email.attachments ?? [];
  return (
    <div className="flex-1 overflow-y-auto">
      {email.bodyHtml ? (
        <div className="px-6 py-1">
          <iframe
            srcDoc={email.bodyHtml}
            sandbox="allow-same-origin"
            className="w-full min-h-64 border-0"
            title="Email body"
          />
        </div>
      ) : (
        <div className="px-6 py-5">
          <div className="text-sm leading-relaxed text-foreground/90">
            {(email.bodyText ?? '(no content)').split('\n').map((line, i) => (
              <p key={i} className="min-h-5">
                {line || ' '}
              </p>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="px-6 pb-6 pt-2">
          <div className="mb-3 flex items-center gap-2">
            <PaperclipIcon className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {attachments.length} Attachment
              {attachments.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {attachments.map((att, i) => (
              <AttachmentItem key={i} attachment={att} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
