import { cn } from '@/lib/utils';
import type { Client } from '@/store/types';
import { avatarBg, monogram } from './client-avatar-utils';

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
          'size-10 shrink-0 squircle bg-muted object-contain p-0.5',
          className
        )}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{ backgroundColor: avatarBg(client.companyName) }}
      className={cn(
        'flex size-10 shrink-0 select-none items-center justify-center squircle text-sm font-semibold leading-none tracking-tight text-white',
        className
      )}
    >
      {monogram(client.companyName)}
    </div>
  );
}
