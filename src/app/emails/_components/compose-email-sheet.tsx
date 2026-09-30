import {
  RecipientField,
  type RecipientFieldHandle,
} from '@/components/recipient-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { escapeHtml } from '@/lib/html';
import { parseRecipients } from '@/lib/recipients';
import { useEmailStore, useEmailTemplateStore } from '@/store';
import type { Email, EmailAttachment } from '@/store/types';
import {
  FileIcon,
  Loader2Icon,
  PaperclipIcon,
  SendIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { TemplateSelection } from './template-selector';
import { TemplateSelector } from './template-selector';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Substitute `{{var}}` placeholders in a template string with values. */
function substituteVars(
  tpl: string,
  vars: Record<string, string> | undefined
): string {
  if (!vars) return tpl;
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type ComposeMode =
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

export type { ComposeMode };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: ComposeMode;
};

export function ComposeEmailSheet({
  open,
  onOpenChange,
  mode = { type: 'new' },
}: Props) {
  const replyEmail = mode.type === 'reply' ? mode.email : null;
  const forwardEmail = mode.type === 'forward' ? mode.email : null;
  const prefill = mode.type === 'prefill' ? mode : null;

  // The form is initialised from `mode` once per opening. We track which mode
  // signature produced the current state, and — following the React docs'
  // "adjusting state when a prop changes" pattern — synchronise during render
  // (not inside an effect) when the signature differs. Calling setState during
  // render is allowed because React bails out before committing.
  const modeSignature = open
    ? mode.type === 'reply'
      ? `reply:${mode.email._id}`
      : mode.type === 'forward'
        ? `forward:${mode.email._id}`
        : mode.type === 'prefill'
          ? `prefill:${mode.to}:${mode.subject ?? ''}:${mode.body ?? ''}:${mode.templateType ?? ''}`
          : 'new'
    : 'closed';

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  // The chosen template's id (not its type) — a type can hold several
  // templates, so the id is the only thing that identifies which one was used.
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [lastSignature, setLastSignature] = useState(modeSignature);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Lets Send pick up an address that is still being typed in the field.
  const toRef = useRef<RecipientFieldHandle>(null);
  const ccRef = useRef<RecipientFieldHandle>(null);
  const bccRef = useRef<RecipientFieldHandle>(null);

  if (lastSignature !== modeSignature) {
    setLastSignature(modeSignature);
    if (!open || mode.type === 'new') {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setSelectedTemplateId('');
      setShowCc(false);
      setShowBcc(false);
      setAttachments([]);
    } else if (mode.type === 'reply') {
      setTo(mode.email.from);
      setCc(mode.email.cc?.join(', ') ?? '');
      setBcc('');
      setSubject(`Re: ${mode.email.subject}`);
      setBody(
        `\n\n---\nOn ${mode.email.sentAt ?? mode.email.receivedAt}, ${mode.email.from} wrote:\n\n${mode.email.bodyText}`
      );
      setSelectedTemplateId('');
      setShowCc(!!mode.email.cc?.length);
      setShowBcc(false);
      setAttachments([]);
    } else if (mode.type === 'forward') {
      setTo('');
      setCc('');
      setBcc('');
      setSubject(`Fwd: ${mode.email.subject}`);
      setBody(
        `\n\n---\n---------- Forwarded message ----------\nFrom: ${mode.email.from}\nDate: ${mode.email.sentAt ?? mode.email.receivedAt}\nSubject: ${mode.email.subject}\nTo: ${mode.email.to.join(', ')}\n\n${mode.email.bodyText}`
      );
      setSelectedTemplateId('');
      setShowCc(false);
      setShowBcc(false);
      // Forwarding inherits the original message's attachments by reference.
      setAttachments(mode.email.attachments ?? []);
    } else if (mode.type === 'prefill') {
      setTo(mode.to);
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
      setAttachments([]);

      // Prefill carries no explicit template choice, so fall back to the
      // default (first active) template of the requested type — and remember
      // its id so the email is logged against the template it actually used.
      const templates = useEmailTemplateStore.getState().items;
      const tmpl = mode.templateType
        ? templates.find(t => t.type === mode.templateType && t.isActive)
        : undefined;
      setSelectedTemplateId(tmpl?._id ?? '');

      const prefillSubject = mode.subject ?? '';
      const prefillBody = mode.body ?? '';
      const vars = mode.variables;
      setSubject(substituteVars(prefillSubject || tmpl?.subject || '', vars));
      setBody(substituteVars(prefillBody || tmpl?.bodyText || '', vars));
    }
  }

  const { send, mutating, uploading, uploadAttachment } = useEmailStore();

  const title =
    mode.type === 'reply'
      ? 'Reply'
      : mode.type === 'forward'
        ? 'Forward'
        : mode.type === 'prefill'
          ? 'New Email'
          : 'New Email';

  function parseEmails(val: string): string[] {
    return parseRecipients(val);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 10 MB limit.`);
        continue;
      }
      try {
        const att = await uploadAttachment(file);
        setAttachments(prev => [...prev, att]);
      } catch {
        toast.error(`Failed to upload ${file.name}.`);
      }
    }
    // Reset the input so selecting the same file again still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  function handleTemplateChange(selection: TemplateSelection | null) {
    if (!selection) {
      setSelectedTemplateId('');
      setSubject('');
      setBody('');
      return;
    }
    const vars = prefill?.variables;
    setSelectedTemplateId(selection.templateId);
    if (selection.subject) setSubject(substituteVars(selection.subject, vars));
    if (selection.bodyText) setBody(substituteVars(selection.bodyText, vars));
  }

  async function handleSend() {
    // Commit anything still half-typed in the recipient fields first — the
    // caller gets the final strings back, so a Send click cannot drop an
    // address the user had typed but not yet separated with Enter/comma.
    const finalTo = toRef.current?.flush() ?? to;
    const finalCc = ccRef.current?.flush() ?? cc;
    const finalBcc = bccRef.current?.flush() ?? bcc;

    const toList = parseEmails(finalTo);
    if (!toList.length || !subject.trim() || !body.trim()) {
      toast.error('To, Subject, and Message are required.');
      return;
    }
    if (uploading) {
      toast.error('Please wait for the attachment upload to finish.');
      return;
    }

    // The selector hands back the exact template id, so no re-resolution by
    // type is needed — that lookup always returned the first match and logged
    // every email of a type against the same template.
    const templateId = selectedTemplateId || undefined;
    const ccList = parseEmails(finalCc);
    const bccList = parseEmails(finalBcc);

    try {
      await send({
        to: toList,
        cc: ccList.length ? ccList : undefined,
        bcc: bccList.length ? bccList : undefined,
        subject: subject.trim(),
        // Escape the body: it is plain text being wrapped as HTML, so `<` must
        // not be sent to the recipient as markup.
        bodyHtml: `<pre style="font-family:inherit">${escapeHtml(body)}</pre>`,
        bodyText: body,
        templateId,
        context: prefill?.context,
        variables: prefill?.variables,
        inReplyTo: replyEmail?._id,
        threadId: replyEmail?.threadId ?? forwardEmail?.threadId,
        attachments: attachments.length ? attachments : undefined,
      });
      toast.success('Email sent.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to send email.');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ width: '44rem', maxWidth: '100vw' }}
        className="flex flex-col gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-base font-medium">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Compose an email with recipients, subject and message.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-4">
            {/* Template picker */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template">Template</Label>
              <TemplateSelector
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                disabled={uploading}
              />
            </div>

            {/* To */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="to">To</Label>
                {!showCc && !showBcc && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      setShowCc(true);
                      setShowBcc(true);
                    }}
                  >
                    + Cc / Bcc
                  </button>
                )}
              </div>
              <RecipientField
                id="to"
                ref={toRef}
                placeholder="recipient@email.com"
                value={to}
                onChange={setTo}
              />
            </div>

            {/* Cc */}
            {showCc && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cc">Cc</Label>
                <RecipientField
                  id="cc"
                  ref={ccRef}
                  placeholder="cc@email.com"
                  value={cc}
                  onChange={setCc}
                />
              </div>
            )}

            {/* Bcc */}
            {showBcc && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bcc">Bcc</Label>
                <RecipientField
                  id="bcc"
                  ref={bccRef}
                  placeholder="bcc@email.com"
                  value={bcc}
                  onChange={setBcc}
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Write your message here..."
                value={body}
                onChange={e => setBody(e.target.value)}
                className="min-h-64 resize-none leading-relaxed"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Attachments</Label>
                <div className="flex flex-col gap-1.5">
                  {attachments.map((att, i) => (
                    <div
                      key={`${att.url}-${i}`}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                    >
                      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(att.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeAttachment(i)}
                        aria-label={`Remove ${att.filename}`}
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PaperclipIcon className="size-4" />
            )}
            {uploading ? 'Uploading…' : 'Attach file'}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button
              className="gap-2"
              onClick={handleSend}
              disabled={mutating || uploading}
            >
              <SendIcon className="size-4" />
              {mutating ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
