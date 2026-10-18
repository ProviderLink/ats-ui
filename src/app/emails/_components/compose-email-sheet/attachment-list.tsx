import { Label } from '@/components/ui/label';
import { formatFileSize } from '@/lib/utils';
import type { EmailAttachment } from '@/store/types';
import { FileIcon, Trash2Icon } from 'lucide-react';

interface AttachmentListProps {
  attachments: EmailAttachment[];
  onRemove: (index: number) => void;
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null;
  return (
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
              <p className="truncate text-xs font-medium">{att.filename}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(att.size)}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${att.filename}`}
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
