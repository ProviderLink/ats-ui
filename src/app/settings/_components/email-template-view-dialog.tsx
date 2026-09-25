import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { useUserStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { StarIcon } from 'lucide-react';
import { EMAIL_TEMPLATE_TYPES } from '../_data/settings';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: EmailTemplate | null;
  onEdit?: (template: EmailTemplate) => void;
};

const TYPE_LABEL = Object.fromEntries(
  EMAIL_TEMPLATE_TYPES.map(t => [t.value, t.label])
) as Record<string, string>;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-base font-semibold leading-none">
            {template.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {`Preview of the ${TYPE_LABEL[template.type] ?? template.type} email template.`}
          </DialogDescription>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Badge variant="outline" className="text-xs h-4 px-1.5">
              {TYPE_LABEL[template.type] ?? template.type}
            </Badge>
            {template.isDefault && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5 gap-0.5">
                <StarIcon className="size-2.5" />
                Default for {TYPE_LABEL[template.type] ?? template.type}
              </Badge>
            )}
            <Badge
              variant={template.isActive ? 'secondary' : 'outline'}
              className="text-xs h-4 px-1.5"
            >
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col gap-4 px-6 py-5">
            {/* Subject */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Subject
              </p>
              <p className="text-sm">{template.subject}</p>
            </div>

            <Separator />

            {/* Body */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Body
              </p>
              {template.bodyText ? (
                <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap bg-muted/50 rounded-md border px-4 py-3">
                  {template.bodyText}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No body content.
                </p>
              )}
            </div>

            {/* Variables used */}
            {template.variables && template.variables.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Variables used
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map(v => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created by {resolveUser(template.createdBy)}</span>
              <span>{formatDate(template.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Close
          </Button>
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onEdit(template);
              }}
            >
              Edit template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
