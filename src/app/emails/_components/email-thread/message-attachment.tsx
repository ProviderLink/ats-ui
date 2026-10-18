import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import type { EmailAttachment } from '@/store/types';
import { DownloadIcon, FileIcon } from 'lucide-react';

export function MessageAttachment({
  attachment,
}: {
  attachment: EmailAttachment;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" asChild>
        <a
          href={attachment.url}
          download={attachment.filename}
          aria-label={`Download ${attachment.filename}`}
        >
          <DownloadIcon className="size-4" />
        </a>
      </Button>
    </div>
  );
}
