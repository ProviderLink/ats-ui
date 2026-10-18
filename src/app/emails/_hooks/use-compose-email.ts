import type { RecipientFieldHandle } from '@/components/recipient-field';
import { escapeHtml } from '@/lib/html';
import { substituteTemplate } from '@/lib/email-template';
import { parseRecipients } from '@/lib/recipients';
import { useEmailStore } from '@/store';
import type { EmailAttachment } from '@/store/types';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { TemplateSelection } from '../_components/template-selector';
import {
  getInitialComposeState,
  getModeSignature,
  type ComposeMode,
} from '../_utils/compose-mode';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function useComposeEmail(
  open: boolean,
  mode: ComposeMode,
  onClose: () => void
) {
  const replyEmail = mode.type === 'reply' ? mode.email : null;
  const forwardEmail = mode.type === 'forward' ? mode.email : null;
  const prefill = mode.type === 'prefill' ? mode : null;

  const initial = getInitialComposeState(mode, open);
  const [to, setTo] = useState(initial.to);
  const [cc, setCc] = useState(initial.cc);
  const [bcc, setBcc] = useState(initial.bcc);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [templateId, setTemplateId] = useState(initial.templateId);
  const [showCc, setShowCc] = useState(initial.showCc);
  const [showBcc, setShowBcc] = useState(initial.showBcc);
  const [attachments, setAttachments] = useState<EmailAttachment[]>(
    initial.attachments
  );

  // Re-initialise the form once per opening. Synchronising during render (not
  // in an effect) follows React's "adjusting state when a prop changes"
  // pattern: React bails out before committing.
  const modeSignature = getModeSignature(mode, open);
  const [lastSignature, setLastSignature] = useState(modeSignature);
  if (lastSignature !== modeSignature) {
    setLastSignature(modeSignature);
    setTo(initial.to);
    setCc(initial.cc);
    setBcc(initial.bcc);
    setSubject(initial.subject);
    setBody(initial.body);
    setTemplateId(initial.templateId);
    setShowCc(initial.showCc);
    setShowBcc(initial.showBcc);
    setAttachments(initial.attachments);
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Lets Send pick up an address that is still being typed in the field.
  const toRef = useRef<RecipientFieldHandle>(null);
  const ccRef = useRef<RecipientFieldHandle>(null);
  const bccRef = useRef<RecipientFieldHandle>(null);

  const send = useEmailStore(s => s.send);
  const mutating = useEmailStore(s => s.mutating);
  const uploading = useEmailStore(s => s.uploading);
  const uploadAttachment = useEmailStore(s => s.uploadAttachment);

  async function addFiles(files: FileList | null) {
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

  function changeTemplate(selection: TemplateSelection | null) {
    if (!selection) {
      setTemplateId('');
      setSubject('');
      setBody('');
      return;
    }
    const vars = prefill?.variables;
    setTemplateId(selection.templateId);
    if (selection.subject)
      setSubject(substituteTemplate(selection.subject, vars));
    if (selection.bodyText)
      setBody(substituteTemplate(selection.bodyText, vars));
  }

  async function submit() {
    // Commit anything still half-typed in the recipient fields — the caller
    // gets the final strings back, so a Send click cannot drop an address the
    // user had typed but not yet separated with Enter/comma.
    const finalTo = toRef.current?.flush() ?? to;
    const finalCc = ccRef.current?.flush() ?? cc;
    const finalBcc = bccRef.current?.flush() ?? bcc;

    const toList = parseRecipients(finalTo);
    if (!toList.length || !subject.trim() || !body.trim()) {
      toast.error('To, Subject, and Message are required.');
      return;
    }
    if (uploading) {
      toast.error('Please wait for the attachment upload to finish.');
      return;
    }

    const ccList = parseRecipients(finalCc);
    const bccList = parseRecipients(finalBcc);

    const message = {
      cc: ccList.length ? ccList : undefined,
      bcc: bccList.length ? bccList : undefined,
      subject: subject.trim(),
      // Plain text wrapped as HTML: escape it so `<` isn't sent as markup.
      bodyHtml: `<pre style="font-family:inherit">${escapeHtml(body)}</pre>`,
      bodyText: body,
      // The selector hands back the exact template id; resolving by type would
      // log every email of a type against the first matching template.
      templateId: templateId || undefined,
      context: prefill?.context,
      variables: prefill?.variables,
      inReplyTo: replyEmail?._id,
      threadId: replyEmail?.threadId ?? forwardEmail?.threadId,
      attachments: attachments.length ? attachments : undefined,
    };

    // A bulk candidate send goes out as one message per recipient, so
    // candidates never see each other's addresses in the To line.
    if (prefill && toList.length > 1) {
      const failedAddresses: string[] = [];
      for (const address of toList) {
        try {
          await send({ ...message, to: [address] });
        } catch {
          failedAddresses.push(address);
        }
      }
      if (failedAddresses.length === 0) {
        toast.success(`Sent ${toList.length} emails.`);
        onClose();
      } else {
        // Keep the sheet open with only the failed addresses so a retry does
        // not email the successful ones again.
        setTo(failedAddresses.join(', '));
        toast.error(
          `Failed to send to ${failedAddresses.length} of ${toList.length} recipients.`
        );
      }
      return;
    }

    try {
      await send({ ...message, to: toList });
      toast.success('Email sent.');
      onClose();
    } catch {
      toast.error('Failed to send email.');
    }
  }

  return {
    to,
    setTo,
    cc,
    setCc,
    bcc,
    setBcc,
    subject,
    setSubject,
    body,
    setBody,
    templateId,
    showCc,
    showBcc,
    showBothCopyFields: () => {
      setShowCc(true);
      setShowBcc(true);
    },
    attachments,
    toRef,
    ccRef,
    bccRef,
    fileInputRef,
    mutating,
    uploading,
    addFiles,
    removeAttachment,
    changeTemplate,
    submit,
  };
}
