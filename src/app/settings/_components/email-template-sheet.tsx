import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type { EmailTemplate, EmailTemplateType } from '@/store/types';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EMAIL_TEMPLATE_TYPES, EMAIL_VARIABLES } from '../_data/settings';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: EmailTemplate;
  onSave: (
    data: Omit<
      EmailTemplate,
      | '_id'
      | 'createdBy'
      | 'updatedBy'
      | 'createdAt'
      | 'updatedAt'
      | 'variables'
    > & { variables: string[] }
  ) => Promise<void> | void;
};

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

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '');
      setSubject(template?.subject ?? '');
      setBodyText(template?.bodyText ?? '');
      setType(template?.type ?? 'general');
      setIsDefault(template?.isDefault ?? false);
    }
  }, [open, template]);

  function insertVariable(v: string) {
    setBodyText(prev => prev + `{{${v}}}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) return;
    const trimmedBody = bodyText.trim();
    const usedVars = EMAIL_VARIABLES.filter(v =>
      trimmedBody.includes(`{{${v}}}`)
    );
    // Each paragraph is plain text being wrapped as HTML — escape it, or the
    // raw `<` reaches the recipient as markup.
    const bodyHtml = trimmedBody
      ? trimmedBody
          .split('\n\n')
          .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
          .join('')
      : '';
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml,
        bodyText: trimmedBody,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[30vw] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-base">
            {isEdit ? 'Edit Template' : 'New Email Template'}
          </SheetTitle>
          {isEdit && (
            <p className="text-xs text-muted-foreground">{template.name}</p>
          )}
          <SheetDescription className="sr-only">
            Email template name, type, subject and body.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EMAIL_TEMPLATE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setType(t.value as EmailTemplateType);
                        setIsDefault(false);
                      }}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        type === t.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="et-subject">
                Subject line <span className="text-destructive">*</span>
              </Label>
              <Input
                id="et-subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Your interview for {{jobTitle}}"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="et-body">Body</Label>
              <Textarea
                id="et-body"
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder="Write your email body here..."
                className="resize-y min-h-52 font-mono text-xs leading-relaxed"
              />
              <div className="flex flex-col gap-1.5 pt-0.5">
                <p className="text-xs text-muted-foreground">
                  Insert variable:
                </p>
                <div className="flex flex-wrap gap-1">
                  {EMAIL_VARIABLES.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent font-mono text-xs"
                      >
                        {`{{${v}}}`}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-6 py-4 border-t bg-muted/30">
            {/* Default toggle — hidden if already default */}
            {!template?.isDefault && (
              <>
                <label
                  htmlFor="et-is-default"
                  className={cn(
                    'flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer select-none transition-colors',
                    isDefault
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-background hover:bg-accent/50'
                  )}
                >
                  <Checkbox
                    checked={isDefault}
                    onCheckedChange={v => setIsDefault(!!v)}
                    id="et-is-default"
                    disabled={submitting}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">
                      Set as default for{' '}
                      <span className={cn(isDefault ? 'text-primary' : '')}>
                        {EMAIL_TEMPLATE_TYPES.find(t => t.value === type)
                          ?.label ?? type}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Auto-selected when composing a{' '}
                      {EMAIL_TEMPLATE_TYPES.find(t => t.value === type)
                        ?.label ?? type}{' '}
                      email. Replaces the current default.
                    </span>
                  </div>
                </label>
                <Separator />
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !name.trim() || !subject.trim()}
                className="min-w-28"
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
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
