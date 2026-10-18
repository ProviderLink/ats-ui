import type { ClientContact } from '@/store/types';

export function ContactCell({ contacts }: { contacts: ClientContact[] }) {
  const primary = contacts.find(c => c.isPrimary) ?? contacts[0];
  if (!primary) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div>
      <p className="text-sm font-medium">{primary.name}</p>
      <p className="text-xs text-muted-foreground truncate max-w-40">
        {primary.position || primary.email}
      </p>
    </div>
  );
}
