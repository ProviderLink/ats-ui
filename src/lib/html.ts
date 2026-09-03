/**
 * Plain-text helpers for rendering stored HTML (job descriptions, notes,
 * activity descriptions) as clean, readable text without exposing raw tags.
 */

const HTML_TAG_RE = /<[a-zA-Z][^>]*>/;

/** True when the string already contains HTML markup. */
export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_RE.test(value);
}

/** Block-level tags that should produce a line break when flattened. */
const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'table',
  'tr',
]);

/**
 * Convert an HTML string into readable plain text.
 *
 * - Block elements become newlines.
 * - List items become `•` bullets, indented by nesting depth.
 * - Blockquotes are indented.
 * - Bold/italic/links are flattened to their text content.
 * - HTML entities are decoded.
 *
 * Non-HTML input is returned unchanged.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (!looksLikeHtml(html)) return html;

  if (typeof DOMParser === 'undefined') return stripTags(html);
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function walk(node: Node, listDepth: number): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br' || tag === 'hr') return '\n';

    if (tag === 'li') {
      const indent = '  '.repeat(Math.max(0, listDepth - 1));
      const inner = Array.from(el.childNodes)
        .map(c => walk(c, listDepth))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      return `${indent}• ${inner}\n`;
    }

    if (tag === 'ul' || tag === 'ol') {
      const inner = Array.from(el.childNodes)
        .map(c => walk(c, listDepth + 1))
        .join('');
      return `\n${inner.trimEnd()}\n`;
    }

    if (tag === 'blockquote') {
      const inner = Array.from(el.childNodes)
        .map(c => walk(c, listDepth))
        .join('')
        .trim();
      return `\n${inner
        .split('\n')
        .map(l => `  ${l}`)
        .join('\n')}\n`;
    }

    const inner = Array.from(el.childNodes)
      .map(c => walk(c, listDepth))
      .join('');

    return BLOCK_TAGS.has(tag) ? `${inner.trim()}\n` : inner;
  }

  return walk(doc.body, 0)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/** Regex fallback when DOMParser is unavailable (SSR / test environments). */
function stripTags(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(
      /<\/(p|div|h[1-6]|li|blockquote|pre|tr|ul|ol|section|article)[^>]*>/gi,
      '\n'
    )
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Produce a concise summary of a plain-text blob. Keeps up to `maxWords`
 * words and snaps back to the nearest sentence boundary so the summary reads
 * cleanly instead of ending mid-word.
 */
export function summarizeText(
  text: string,
  maxWords = 90
): { summary: string; truncated: boolean } {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const words = trimmed.split(' ');
  if (words.length <= maxWords) return { summary: trimmed, truncated: false };

  const slice = words.slice(0, maxWords).join(' ');
  const lastBreak = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  );
  // Only snap back if the break is reasonably far in (avoid a stub summary).
  const summary =
    lastBreak > maxWords * 0.4 ? slice.slice(0, lastBreak + 1) : slice;
  return { summary: summary.trim(), truncated: true };
}
