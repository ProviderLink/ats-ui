import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { AlertCircleIcon, AlertTriangleIcon, StarIcon } from 'lucide-react';
import { SectionLabel } from './section-label';

export function CrmProfileSection({ candidate: c }: { candidate: Candidate }) {
  const crm = c.crmProfile;
  if (!crm) return null;
  const { satisfactionScore } = crm;

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-3">
        <SectionLabel>CRM Profile</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {crm.workloadLevel && (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">
                Workload
              </p>
              <Badge variant="outline" className="w-fit capitalize">
                {crm.workloadLevel}
              </Badge>
            </div>
          )}
          {satisfactionScore != null && (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">
                Satisfaction
              </p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      'size-3.5',
                      i < satisfactionScore
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
            </div>
          )}
          {crm.lastVaCheckin && (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">
                Last VA Check-in
              </p>
              <p className="text-xs font-medium">
                {crm.lastVaCheckin}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {crm.burnoutRiskFlag && (
            <div className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/20 dark:text-orange-300">
              <AlertTriangleIcon className="size-3.5" />
              Burnout Risk
            </div>
          )}
          {crm.replacementRiskFlag && (
            <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive">
              <AlertCircleIcon className="size-3.5" />
              Replacement Risk
            </div>
          )}
        </div>
        {crm.notes && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {crm.notes}
          </p>
        )}
      </div>
    </>
  );
}
