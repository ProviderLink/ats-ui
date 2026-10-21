import { MapPinIcon } from 'lucide-react';
import type { Client } from '@/store/types';
import { ClientAvatar } from './client-avatar';
import { CrmIndicator } from './crm-indicator';

export function CompanyCell({ client }: { client: Client }) {
  const location = [client.address?.city, client.address?.state]
    .filter(Boolean)
    .join(', ');
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative shrink-0">
        <ClientAvatar client={client} />
        <CrmIndicator clientId={client._id} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">
          {client.companyName}
        </p>
        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </div>
  );
}
