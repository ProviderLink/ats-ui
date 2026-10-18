import { cn } from '@/lib/utils';
import type { Client } from '@/store/types';
import { CrmIndicator } from './crm-indicator';

const AVATAR_BG = [
  'bg-pine-teal-100 text-pine-teal-800 dark:bg-pine-teal-900 dark:text-pine-teal-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
];

export function CompanyCell({ client }: { client: Client }) {
  const bg = AVATAR_BG[client.companyName.charCodeAt(0) % AVATAR_BG.length];
  return (
    <div className="flex items-center gap-2 min-w-0">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.companyName}
          className="size-7 rounded-md object-cover shrink-0"
        />
      ) : (
        <div
          className={cn(
            'size-7 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 select-none',
            bg
          )}
        >
          {client.companyName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-medium leading-tight truncate">
          {client.companyName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {[client.address?.city, client.address?.state]
            .filter(Boolean)
            .join(', ') || '—'}
        </p>
      </div>
      <CrmIndicator clientId={client._id} />
    </div>
  );
}
