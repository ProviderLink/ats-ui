import { avatarBg, phaseConfig } from '@/lib/candidate-styles';
import { cn, formatDate } from '@/lib/utils';
import type { Tag } from '@/store/types';
import {
  BriefcaseIcon,
  CalendarClockIcon,
  LayersIcon,
  UploadIcon,
  UserIcon,
} from 'lucide-react';
import type { CandidatePair } from '../../_utils/job-candidates';

interface CandidateRowCardProps extends CandidatePair {
  tag: Tag | null;
  onOpen: () => void;
}

export function CandidateRowCard({
  candidate,
  application,
  tag,
  onOpen,
}: CandidateRowCardProps) {
  const { label: phaseLabel, cls: phaseCls } = phaseConfig[application.phase];
  const applied = candidate.source === 'applied';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left rounded-xl border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all dark:bg-white/4 dark:border-white/[0.07] dark:hover:bg-white/8 dark:hover:border-primary/40"
    >
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 min-w-0">
        <div
          className={cn(
            'size-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none ring-1 ring-black/5 dark:ring-white/10',
            avatarBg(candidate.firstName)
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {candidate.email}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              'inline-flex items-center h-5 px-1.5 text-[10px] font-medium leading-none rounded-full border',
              phaseCls
            )}
          >
            {phaseLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-[11px] text-muted-foreground">
        {candidate.yearsOfExperience > 0 && (
          <span className="inline-flex items-center gap-1 shrink-0 font-semibold text-foreground">
            <BriefcaseIcon className="size-3" />
            {candidate.yearsOfExperience}y exp
          </span>
        )}
        {application.currentStage && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 rounded-full border border-border/70 bg-muted/50 px-2 min-h-5 py-0.5 leading-tight"
            title={`Pipeline stage: ${application.currentStage.stageName}`}
          >
            <LayersIcon className="size-3 shrink-0" />
            <span className="wrap-break-word">
              {application.currentStage.stageName}
            </span>
          </span>
        )}
        {tag?.name && tag.color && (
          <span
            className="inline-flex items-center rounded-full border px-1.5 h-5 font-medium shrink-0"
            style={{
              borderColor: tag.color + '70',
              color: tag.color,
              backgroundColor: tag.color + '12',
            }}
          >
            {tag.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-muted/40 dark:bg-white/2 text-[10px] text-muted-foreground/80">
        <span className="inline-flex items-center gap-1">
          {applied ? (
            <UserIcon className="size-3" />
          ) : (
            <UploadIcon className="size-3" />
          )}
          {applied ? 'Applied' : 'Uploaded'}
        </span>
        <span
          className="inline-flex items-center gap-1"
          title={formatDate(application.appliedAt)}
        >
          <CalendarClockIcon className="size-3" />
          {formatDate(application.appliedAt)}
        </span>
      </div>
    </button>
  );
}
