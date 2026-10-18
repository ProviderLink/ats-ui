import { marked } from 'marked';
import { looksLikeHtml } from './html';

marked.setOptions({ gfm: true, breaks: true });

/** True when plain text looks like markdown (list / bold / heading markers). */
export function looksLikeMarkdown(text: string): boolean {
  return (
    /(^|\n)[ \t]*([-*+]|\d+\.)[ \t]+/.test(text) ||
    /\*\*[^*\n]+\*\*/.test(text) ||
    /^#{1,6}\s/m.test(text)
  );
}

/**
 * Convert a stored description into renderable/editable HTML.
 *
 * - Rich HTML passes through unchanged (already produced by the editor).
 * - Plain text is treated as markdown so legacy `- ` / `* ` / `1. ` lists,
 *   `**bold**`, headings, and newlines render as real bullets, bold, and
 *   line breaks instead of collapsing or showing literal markers.
 */
export function descriptionToHtml(value: string): string {
  if (!value) return '';
  if (looksLikeHtml(value)) return value;
  return marked.parse(value) as string;
}
