import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { formatDate } from '@/lib/utils';
import { useUserStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { MailIcon, PencilIcon, PowerIcon, StarIcon } from 'lucide-react';
import { IconTile, PANEL_CLS, Pill, SectionHeading } from './template-ui';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: EmailTemplate | null;
  onEdit?: (template: EmailTemplate) => void;
};

/** Text with its `{{variables}}` shown as small highlighted tokens. */
function WithVariables({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\{\w+\}\})/g).map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span
            key={i}
            className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[0.85em] text-blue-900 dark:bg-blue-500/15 dark:text-blue-300"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function EmailTemplateViewDialog({
  open,
  onOpenChange,
  template,
  onEdit,
}: Props) {
  const users = useUserStore(s => s.items);

  if (!template) return null;

  function resolveUser(id?: string) {
    if (!id) return 'System';
    const u = users.find(u => u._id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'System';
  }

  const typeLabel = EMAIL_TEMPLATE_TYPE_LABELS[template.type] ?? template.type;
  const varCount = template.variables?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="flex-row items-start gap-3 px-6 pt-6 pb-4 pr-14">
          <IconTile icon={MailIcon} />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base leading-tight font-semibold">
              {template.name}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {typeLabel} email
              {varCount > 0 &&
                ` · ${varCount} variable${varCount !== 1 ? 's' : ''}`}
            </DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {template.isDefault && (
                <Pill tone="amber" icon={StarIcon}>
                  Default for {typeLabel}
                </Pill>
              )}
              <Pill
                tone={template.isActive ? 'emerald' : 'neutral'}
                icon={PowerIcon}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </Pill>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto border-t px-6 py-5">
          <section className="flex flex-col gap-3">
            <SectionHeading>Message preview</SectionHeading>
            <div className={PANEL_CLS}>
              <div className="border-b border-gray-200 px-4 py-3 dark:border-border">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Subject
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">
                  <WithVariables text={template.subject} />
                </p>
              </div>
              <div className="px-4 py-4">
                {template.bodyText ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    <WithVariables text={template.bodyText} />
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No body content.
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Highlighted items are filled in automatically when the email is
              sent.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-gray-50 px-6 py-3 dark:bg-white/3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            Created by {resolveUser(template.createdBy)} ·{' '}
            {formatDate(template.createdAt)}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {onEdit && (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(template);
                }}
              >
                <PencilIcon className="size-3.5" />
                Edit template
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
