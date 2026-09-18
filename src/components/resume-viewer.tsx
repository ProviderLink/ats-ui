import { Button } from '@/components/ui/button';
import { getAuthToken } from '@/lib/api-client';
import { downloadFileWithAuth } from '@/lib/download';
import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  Maximize2Icon,
  Minimize2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Inline resume preview.
 *
 * PDF  — fetched as an authenticated blob and shown in a native <iframe>.
 * DOCX — fetched as an authenticated blob and rendered to HTML client-side with
 *        `docx-preview` (lazy-loaded, so PDF-only readers never download it).
 * Anything else (legacy `.doc`, unknown extension) falls back to the
 * download-only message.
 *
 * The DOCX renderer is always imported dynamically: it pulls in JSZip and is
 * only needed when a DOCX is actually previewed.
 */

type ResumeKind = 'pdf' | 'docx' | 'unsupported';

type PreviewStatus = 'loading' | 'ready' | 'error';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Wrapper class handed to docx-preview. It is used as the CSS scope for all
 * styles extracted from the document, so a distinctive name keeps them from
 * colliding with anything else in the app.
 */
const DOCX_CLASS = 'docx-preview-canvas';

/** Only these schemes are safe to leave clickable inside a rendered document. */
const SAFE_HREF = /^(https?:|mailto:|tel:|#)/i;
const SAFE_IMG_SRC = /^(data:image\/|blob:|https?:)/i;

function detectKind(filename: string): ResumeKind {
  const name = (filename || '').split(/[?#]/)[0].trim().toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  return 'unsupported';
}

/**
 * docx-preview builds nodes with `createElement`, so no script can be injected
 * via parsing — but a crafted document can still carry `javascript:` hyperlinks,
 * event-handler attributes or an altChunk iframe. Neutralise those before the
 * markup is shown.
 */
function sanitizeRenderedDocx(host: HTMLElement): void {
  host.querySelectorAll('script, iframe, object, embed').forEach(el => {
    el.remove();
  });

  host.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
    const href = (a.getAttribute('href') ?? '').trim();
    if (!SAFE_HREF.test(href)) {
      a.removeAttribute('href');
      return;
    }
    // In-document bookmarks navigated by the browser itself.
    if (href.startsWith('#')) return;
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  host.querySelectorAll<HTMLImageElement>('img[src]').forEach(img => {
    const src = (img.getAttribute('src') ?? '').trim();
    if (!SAFE_IMG_SRC.test(src)) img.removeAttribute('src');
  });

  // Strip any inline on* handlers.
  host.querySelectorAll<HTMLElement>('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on'))
        el.removeAttribute(attr.name);
    }
  });
}

export function ResumeViewer({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const docxHostRef = useRef<HTMLDivElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Derived during render — no state, so the right host element is mounted
  // before the load effect runs.
  const kind = useMemo(() => detectKind(filename), [filename]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadFileWithAuth(url, filename);
    } catch {
      toast.error('Failed to download the resume');
    } finally {
      setDownloading(false);
    }
  }, [url, filename]);

  useEffect(() => {
    let cancelled = false;

    const revokeBlobUrl = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    const run = async () => {
      // Deferred so no state is set synchronously inside the effect body.
      await Promise.resolve();
      if (cancelled) return;

      if (!url || url === '#' || kind === 'unsupported') {
        revokeBlobUrl();
        setBlobUrl(null);
        setStatus('error');
        return;
      }

      setStatus('loading');
      setBlobUrl(null);
      revokeBlobUrl();

      // Reusing the same container means a failed render would otherwise leave
      // the PREVIOUS document's markup behind the error card.
      const host = docxHostRef.current;
      if (host) host.replaceChildren();

      try {
        const headers: Record<string, string> = {};
        const token = getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`Failed: ${res.status}`);

        const rawBlob = await res.blob();
        if (cancelled) return;

        if (kind === 'pdf') {
          // Re-wrap as a real PDF blob so the browser's viewer handles it.
          const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
          const nextUrl = URL.createObjectURL(pdfBlob);
          blobUrlRef.current = nextUrl;
          setBlobUrl(nextUrl);
          setStatus('ready');
          return;
        }

        if (!host) throw new Error('Preview container unavailable');

        const { renderAsync } = await import('docx-preview');
        await renderAsync(
          new Blob([rawBlob], { type: DOCX_MIME }),
          host,
          host,
          {
            className: DOCX_CLASS,
            // altChunk renders an <iframe srcdoc> — never wanted here.
            renderAltChunks: false,
          }
        );
        if (cancelled) return;

        sanitizeRenderedDocx(host);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        if (host) host.replaceChildren();
        revokeBlobUrl();
        setBlobUrl(null);
        setStatus('error');
      }
    };

    void run();

    return () => {
      cancelled = true;
      revokeBlobUrl();
    };
  }, [url, filename, kind]);

  const loading = status === 'loading';
  const error = status === 'error';

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        expanded ? 'fixed inset-0 z-50 bg-background p-4 flex-1' : 'h-96'
      )}
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileTextIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? (
              <>
                <Minimize2Icon className="size-3.5" />
                Exit
              </>
            ) : (
              <>
                <Maximize2Icon className="size-3.5" />
                Full view
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 rounded-lg border bg-muted/20 overflow-hidden relative">
        {kind === 'docx' && (
          <div
            ref={docxHostRef}
            className="size-full overflow-auto bg-muted/40"
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 z-10">
            <AlertCircleIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Unable to preview this resume inline. You can still download it
              using the button above.
            </p>
          </div>
        )}
        {kind === 'pdf' && !error && blobUrl && (
          <iframe
            src={`${blobUrl}#toolbar=0`}
            title={filename}
            className="size-full"
          />
        )}
      </div>
    </div>
  );
}
