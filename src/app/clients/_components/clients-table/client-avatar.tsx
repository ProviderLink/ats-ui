import { cn } from '@/lib/utils';
import type { Client } from '@/store/types';

/** Stable 0–359 hue from the company name, so each company keeps its colour. */
function hueOf(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/** "Acme Corp" → "AC", "Acme" → "AC", "Zoom" → "ZO". */
function monogram(name: string) {
  const words = name.trim().split(/[\s\-_.&]+/).filter(Boolean);
  const letters =
    words.length > 1
      ? words[0][0] + words[1][0]
      : (words[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** Company logo, or a logo-style monogram tile when there is none. */
export function ClientAvatar({
  client,
  className,
}: {
  client: Pick<Client, 'companyName' | 'logo'>;
  className?: string;
}) {
  if (client.logo) {
    return (
      <img
        src={client.logo}
        alt={client.companyName}
        className={cn(
          'size-10 shrink-0 squircle bg-white object-contain p-0.5',
          className
        )}
      />
    );
  }
  const hue = hueOf(client.companyName);
  return (
    <div
      aria-hidden
      style={
        {
          '--avatar-bg': `oklch(0.95 0.03 ${hue})`,
          '--avatar-fg': `oklch(0.45 0.1 ${hue})`,
          '--avatar-bg-dark': `oklch(0.3 0.05 ${hue})`,
          '--avatar-fg-dark': `oklch(0.85 0.08 ${hue})`,
        } as React.CSSProperties
      }
      className={cn(
        'flex size-10 shrink-0 select-none items-center justify-center squircle bg-(--avatar-bg) text-sm font-semibold leading-none tracking-tight text-(--avatar-fg) dark:bg-(--avatar-bg-dark) dark:text-(--avatar-fg-dark)',
        className
      )}
    >
      {monogram(client.companyName)}
    </div>
  );
}
