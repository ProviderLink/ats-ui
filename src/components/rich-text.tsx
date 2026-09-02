import { descriptionToHtml } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

/**
 * Allowed tags/attrs for job description HTML. Keep this minimal to prevent XSS.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'a',
  'hr',
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html) return null;

  // Legacy descriptions are plain text — render them as markdown so their
  // lists, bold, headings, and line breaks display correctly (instead of
  // collapsing into one continuous block or showing literal "-" / "*").
  const clean = sanitizeHtml(descriptionToHtml(html));
  if (!clean) return null;

  return (
    <div
      className={cn(
        'text-sm leading-relaxed text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li_p]:mb-0 [&_li]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-3 [&_h3]:mb-1 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs',
        className
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
