import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { escapeHtml } from '@/lib/html';
import { cn } from '@/lib/utils';
import type { EmailTemplate, EmailTemplateType } from '@/store/types';
import { Loader2Icon, MailIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  EMAIL_TEMPLATE_TYPES,
  emailVariablesForType,
  KNOWN_EMAIL_VARIABLES,
} from '@/lib/email-templates';
import { IconTile, PANEL_CLS, SectionHeading } from './template-ui';

export type EmailTemplateInput = Omit<
  EmailTemplate,
  '_id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'variables'
> & { variables: string[] };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: EmailTemplate;
  onSave: (data: EmailTemplateInput) => Promise<void> | void;
};

/** Plain text -> the paragraph HTML this editor produces. */
function textToHtml(text: string): string {
  return text
    ? text
        .split('\n\n')
        .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : '';
}

/** `{{placeholders}}` in the text that the server does not recognise. */
function unknownPlaceholders(text: string): string[] {
  const known = new Set<string>(KNOWN_EMAIL_VARIABLES);
  const found = new Set<string>();
  for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!known.has(m[1])) found.add(m[1]);
  }
  return [...found];
}

export function EmailTemplateSheet({
  open,
  onOpenChange,
  template,
  onSave,
}: Props) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [type, setType] = useState<EmailTemplateType>('general');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Rich templates (links, bold, lists, …) can't round-trip through this plain
  // text editor, so their body stays locked until the user opts in.
  const [bodyUnlocked, setBodyUnlocked] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<'subject' | 'body'>('body');

  const isRichTemplate =
    !!template && textToHtml(template.bodyText.trim()) !== template.bodyHtml;
  const bodyLocked = isRichTemplate && !bodyUnlocked;

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '');
      setSubject(template?.subject ?? '');
      setBodyText(template?.bodyText ?? '');
      setType(template?.type ?? 'general');
      setIsDefault(template?.isDefault ?? false);
      setBodyUnlocked(false);
      lastField.current = 'body';
    }
  }, [open, template]);

  /** Insert at the caret of whichever field was focused last. */
  function insertVariable(v: string) {
    const token = `{{${v}}}`;
    const inSubject = lastField.current === 'subject';
    if (!inSubject && bodyLocked) return;
    const el = inSubject ? subjectRef.current : bodyRef.current;
    const value = inSubject ? subject : bodyText;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    (inSubject ? setSubject : setBodyText)(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;
    const trimmedBody = bodyText.trim();
    // Untouched body: send back the stored HTML/text exactly as it was, so
    // editing a name, subject or default never rewrites existing formatting.
    const keepBody = !!template && trimmedBody === template.bodyText.trim();
    const bodyHtml = keepBody ? template.bodyHtml : textToHtml(trimmedBody);
    // Variables are derived from what is actually in the text, so deleting a
    // placeholder removes it from the list on save.
    const combined = `${subject}\n${trimmedBody}`;
    const usedVars = KNOWN_EMAIL_VARIABLES.filter(v =>
      combined.includes(`{{${v}}}`),
    );
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        bodyText: keepBody ? template.bodyText : trimmedBody,
        type,
        variables: usedVars,
        isDefault,
        isActive: template?.isActive ?? true,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = !!template;

  const typeLabel =
    EMAIL_TEMPLATE_TYPES.find(t => t.value === type)?.label ?? type;
  const unknown = unknownPlaceholders(`${subject}\n${bodyText}`);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="flex-row items-start gap-3 border-b px-6 py-5 pr-14">
          <IconTile icon={MailIcon} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base leading-tight">
              {isEdit ? 'Edit email template' : 'New email template'}
            </SheetTitle>
            <SheetDescription className="mt-1 text-xs">
              {isEdit
                ? `Update “${template.name}”.`
                : 'Write a reusable email for recruiters to send.'}
            </SheetDescription>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
            <section className="flex flex-col gap-4">
              <SectionHeading>Template</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="et-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="et-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Interview Invite"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="et-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={v => {
                    setType(v as EmailTemplateType);
                    setIsDefault(false);
                  }}
                >
                  <SelectTrigger id="et-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TEMPLATE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeading>Content</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="et-subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="et-subject"
                  ref={subjectRef}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onFocus={() => (lastField.current = 'subject')}
                  maxLength={200}
                  placeholder="e.g. Your interview for {{jobTitle}}"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="et-body">Body</Label>
                <Textarea
                  id="et-body"
                  ref={bodyRef}
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  onFocus={() => (lastField.current = 'body')}
                  readOnly={bodyLocked}
                  placeholder="Write your email body here…"
                  className="min-h-56 resize-y text-sm leading-relaxed"
                />
                {isRichTemplate && (
                  <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    <span>
                      This template has rich formatting (links, bold, lists…)
                      that this plain-text editor can&apos;t show.{' '}
                      {bodyLocked
                        ? 'Its body is locked so the formatting is kept. You can still change the name, subject, type and default.'
                        : 'Saving a changed body will replace the formatting with plain paragraphs.'}
                    </span>
                    {bodyLocked && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-fit border-amber-400 bg-amber-100 text-xs text-amber-900 hover:bg-amber-200 hover:text-amber-900 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-500/10"
                        onClick={() => setBodyUnlocked(true)}
                      >
                        Edit body as plain text
                      </Button>
                    )}
                  </div>
                )}
                {unknown.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Unknown variable{unknown.length > 1 ? 's' : ''}:{' '}
                    {unknown.map(v => `{{${v}}}`).join(', ')} — sent as-is, not
                    filled in.
                  </p>
                )}
              </div>

              <div className={cn(PANEL_CLS, 'flex flex-col gap-2 p-3')}>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Insert variable
                  </span>{' '}
                  — adds it at the cursor in the subject or body, whichever you
                  last clicked.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emailVariablesForType(type).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded-md border border-blue-300 bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-900 transition-colors hover:bg-blue-200 dark:border-border dark:bg-transparent dark:text-foreground dark:hover:bg-accent"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {!template?.isDefault && (
              <section className="flex flex-col gap-3">
                <SectionHeading>Settings</SectionHeading>
                <div
                  className={cn(
                    PANEL_CLS,
                    'flex items-center justify-between gap-4 px-4 py-3',
                  )}
                >
                  <label htmlFor="et-is-default" className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      Default for {typeLabel}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Auto-selected when composing a {typeLabel} email. Replaces
                      the current default.
                    </span>
                  </label>
                  <Switch
                    id="et-is-default"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                    disabled={submitting}
                    className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=checked]:bg-primary dark:data-[state=unchecked]:bg-input"
                  />
                </div>
              </section>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t bg-gray-50 px-6 py-4 dark:bg-white/3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !subject.trim()}
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create template'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
