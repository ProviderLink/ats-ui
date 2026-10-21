import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserStore } from '@/store/slices/users.store';
import { ShieldCheckIcon } from 'lucide-react';

/** Corner badge for an avatar: the client has active CRM access. */
export function CrmIndicator({ clientId }: { clientId: string }) {
  const allUsers = useUserStore(s => s.items);
  const hasCrm = allUsers.some(
    u => u.clientRef === clientId && u.appAccess?.includes('crm') && u.isActive
  );
  if (!hasCrm) return null;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-pine-teal-600 text-white ring-2 ring-background"
            onClick={e => e.stopPropagation()}
          >
            <ShieldCheckIcon className="size-2.5" aria-hidden />
            <span className="sr-only">CRM access active</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">CRM access active</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
