import { Button } from '@/components/ui/button';
import { downloadFileWithAuth } from '@/lib/download';
import { isHttpUrl } from '@/lib/utils';
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Optional work samples submitted with an application — a link, an uploaded
 * file, or both. Rendered inline in the candidate and talent-pool detail
 * sheets.
 *
 * Deliberately renders an explicit empty state rather than collapsing to
 * nothing: recruiters need to be able to SEE whether an applicant supplied a
 * portfolio, which is impossible if a missing one looks identical to a section
 * that was never added.
 */
export function PortfolioSection({
  url,
  fileUrl,
  fileName,
}: {
  url?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const isEmpty = !url && !fileUrl;

  async function handleDownload() {
    if (!fileUrl) return;
    setDownloading(true);
    try {
      await downloadFileWithAuth(fileUrl, fileName || 'portfolio');
    } catch {
      toast.error('Failed to download the portfolio file');
    } finally {
      setDownloading(false);
    }
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-6 text-center">
        <FileTextIcon className="size-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No portfolio provided.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {url && (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Portfolio Link</p>
          {isHttpUrl(url) ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 break-all text-sm text-primary underline-offset-2 hover:underline"
            >
              <ExternalLinkIcon className="size-3.5 shrink-0" />
              {url}
            </a>
          ) : (
            <span className="break-all text-sm">{url}</span>
          )}
        </div>
      )}

      {fileUrl && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Portfolio File</p>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-md border px-3 py-2">
              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">
                {fileName || 'Portfolio file'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
