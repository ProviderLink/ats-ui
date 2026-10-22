import type { ClientContact } from '@/store/types';
import { avatarBg } from './client-avatar-utils';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');
}

export function ContactCell({ contacts }: { contacts: ClientContact[] }) {
  const primary = contacts.find(c => c.isPrimary) ?? contacts[0];
  if (!primary) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        style={{ backgroundColor: avatarBg(primary.name) }}
        className="size-7 shrink-0 rounded-full text-[10px] font-semibold text-white flex items-center justify-center select-none"
        aria-hidden
      >
        {initials(primary.name) || '?'}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{primary.name}</p>
        <p className="text-xs text-muted-foreground truncate max-w-40">
          {primary.position || primary.email}
        </p>
      </div>
    </div>
  );
}
