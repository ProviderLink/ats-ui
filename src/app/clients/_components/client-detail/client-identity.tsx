import { cn } from '@/lib/utils';
import type { Client } from '@/store/types';
import { healthConfig, statusConfig } from './config';
import { CompanyAvatar } from './primitives';

export function ClientIdentity({ client }: { client: Client }) {
  const status = statusConfig[client.status];
  const crmHealth = client.crmProfile?.healthStatus
    ? healthConfig[client.crmProfile.healthStatus]
    : null;
  const location = [client.address?.city, client.address?.state, client.address?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex items-start gap-4">
      <CompanyAvatar name={client.companyName} logo={client.logo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 truncate text-lg font-semibold leading-tight">
            {client.companyName}
          </h2>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
              status.cls
            )}
          >
            <span className={cn('size-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
        </div>
        {location && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {location}
          </p>
        )}
        {crmHealth && (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 text-xs font-medium',
              crmHealth.cls
            )}
          >
            <span className={cn('size-1.5 rounded-full', crmHealth.dot)} />
            {crmHealth.label}
          </div>
        )}
      </div>
    </div>
  );
}
