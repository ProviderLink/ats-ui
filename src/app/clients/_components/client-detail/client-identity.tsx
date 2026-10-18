import { cn } from '@/lib/utils';
import type { Client } from '@/store/types';
import { healthConfig, statusConfig } from './config';
import { CompanyAvatar } from './primitives';

export function ClientIdentity({ client }: { client: Client }) {
  const status = statusConfig[client.status];
  const crmHealth = client.crmProfile?.healthStatus
    ? healthConfig[client.crmProfile.healthStatus]
    : null;

  return (
    <div className="px-6 pt-6 pb-2">
      <div className="flex items-center gap-4">
        <CompanyAvatar name={client.companyName} logo={client.logo} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight truncate">
            {client.companyName}
          </p>
          {client.address && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[client.address.city, client.address.state, client.address.country]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium',
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
    </div>
  );
}
