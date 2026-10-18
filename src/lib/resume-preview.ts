export type ResumeKind = 'pdf' | 'docx' | 'unsupported';

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Wrapper class handed to docx-preview. It is used as the CSS scope for all
 * styles extracted from the document, so a distinctive name keeps them from
 * colliding with anything else in the app.
 */
export const DOCX_CLASS = 'docx-preview-canvas';

/** Only these schemes are safe to leave clickable inside a rendered document. */
const SAFE_HREF = /^(https?:|mailto:|tel:|#)/i;
const SAFE_IMG_SRC = /^(data:image\/|blob:|https?:)/i;

export function detectKind(filename: string): ResumeKind {
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
export function sanitizeRenderedDocx(host: HTMLElement): void {
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
