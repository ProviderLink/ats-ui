import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EMAIL_STATUS_STYLES } from '@/lib/status-styles';
import { cn } from '@/lib/utils';
import type { EmailStatus } from '@/store/types';

interface EmailStatusBadgeProps {
  status: EmailStatus;
  failureReason?: string | null;
}

export function EmailStatusBadge({
  status,
  failureReason,
}: EmailStatusBadgeProps) {
  const { label, dot, cls } = EMAIL_STATUS_STYLES[status];
  const badge = (
    <Badge
      className={cn(
        'border font-medium bg-transparent cursor-default gap-1.5',
        cls
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </Badge>
  );

  if (status === 'failed' && failureReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {failureReason}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
