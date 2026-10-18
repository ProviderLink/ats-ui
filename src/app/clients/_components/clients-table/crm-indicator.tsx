import { useUserStore } from '@/store/slices/users.store';
import { ShieldCheckIcon } from 'lucide-react';

/** Inline badge showing the client has active CRM access. */
export function CrmIndicator({ clientId }: { clientId: string }) {
  const allUsers = useUserStore(s => s.items);
  const hasCrm = allUsers.some(
    u => u.clientRef === clientId && u.appAccess?.includes('crm') && u.isActive
  );
  if (!hasCrm) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full border border-pine-teal-500/30 bg-pine-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-pine-teal-700 dark:bg-pine-teal-950/40 dark:text-pine-teal-400 shrink-0 select-none"
      title="CRM access active"
    >
      <ShieldCheckIcon className="size-2.5" />
      CRM
    </span>
  );
}
