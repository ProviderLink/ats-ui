import { formatFileSize } from '@/lib/utils';
import type { EmailAttachment } from '@/store/types';
import { DownloadIcon, FileIcon } from 'lucide-react';

export function AttachmentItem({
  attachment,
}: {
  attachment: EmailAttachment;
}) {
  return (
    <a
      href={attachment.url}
      download={attachment.filename}
      className="group flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:border-foreground/20 hover:bg-muted/40"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <FileIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {attachment.filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <DownloadIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    </a>
  );
}
