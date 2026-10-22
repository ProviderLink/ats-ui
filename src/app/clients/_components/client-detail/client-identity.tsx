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
        <h2 className="truncate text-lg font-semibold leading-tight">
          {client.companyName}
        </h2>
        {location && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {location}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
              status.cls
            )}
          >
            <span className={cn('size-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
          {crmHealth && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                crmHealth.cls
              )}
            >
              <span className={cn('size-1.5 rounded-full', crmHealth.dot)} />
              {crmHealth.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
