import { ActivityTimeline } from '@/components/activity-timeline';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import type { Application } from '@/store/types';
import { BanIcon, BriefcaseIcon, CheckCircle2Icon, ChevronRightIcon, ClockIcon, GitCommitHorizontalIcon, UserCheckIcon, XCircleIcon } from 'lucide-react';
import { phaseConfig } from '@/lib/candidate-styles';
import { PipelineProgressBar } from './pipeline-progress-bar';

export function ApplicationCard({
  app,
  jobTitle,
  clientName,
  stages,
  approverName,
}: {
  app: Application;
  jobTitle: string;
  clientName: string;
  stages?: { _id: string; name: string; color: string }[];
  approverName?: string;
}) {
  const { label, cls } = phaseConfig[app.phase];
  const sourceLabel =
    {
      direct_apply: 'Direct Apply',
      internal_upload: 'Uploaded',
      assigned: 'Assigned',
    }[app.source] ?? app.source;

  const isRejected = app.phase === 'rejected';
  const isHired = app.phase === 'hired';
  const isPending = app.phase === 'pending';
  const isApproved = app.phase === 'approved';
  const hasPipeline = isApproved && stages && stages.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border px-4 py-3.5',
        isRejected &&
          'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
        isHired &&
          'border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-700/30 dark:bg-emerald-950/20'
      )}
    >
      {/* Header row: job title + phase badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{jobTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
        </div>
        <Badge className={cn('h-5.5 shrink-0 px-2 text-xs font-medium', cls)}>
          {label}
        </Badge>
      </div>

      {/* Metadata row: source, stage, applied date */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BriefcaseIcon className="size-3" />
          {sourceLabel}
        </span>
        {app.currentStage && (
          <span className="inline-flex items-center gap-1">
            <GitCommitHorizontalIcon className="size-3" />
            {app.currentStage.stageName}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1"
          title={formatDate(app.appliedAt)}
        >
          <ClockIcon className="size-3" />
          {isPending ? (
            <span className="text-amber-600 dark:text-amber-400">
              {timeAgo(app.appliedAt)}
            </span>
          ) : (
            timeAgo(app.appliedAt)
          )}
        </span>
      </div>

      {/* Pipeline progress — approved apps only */}
      {hasPipeline && (
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/40 bg-linear-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/30 dark:to-transparent p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <GitCommitHorizontalIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Pipeline
            </span>
          </div>
          <PipelineProgressBar
            stages={stages!}
            currentStageId={app.currentStage?.stageId ?? null}
          />
        </div>
      )}

      {/* Pipeline metadata — approved apps only */}
      {isApproved && (app.approvedAt || approverName || app.notes) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {app.approvedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/30 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2Icon className="size-3" />
              <span className="font-medium">{formatDate(app.approvedAt)}</span>
            </span>
          )}
          {approverName && (
            <span className="text-muted-foreground">
              by{' '}
              <span className="font-medium text-foreground">
                {approverName}
              </span>
            </span>
          )}
          {app.notes && (
            <span className="w-full text-muted-foreground leading-relaxed mt-0.5 italic text-xs">
              "{app.notes}"
            </span>
          )}
        </div>
      )}

      {/* AI Validation — compact row */}
      {app.aiValidation && (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs">
          {app.aiValidation.isValid ? (
            <CheckCircle2Icon className="size-3.5 mt-px shrink-0 text-emerald-600" />
          ) : (
            <XCircleIcon className="size-3.5 mt-px shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <span className="text-muted-foreground">
              AI Validation · Score{' '}
              <span className="font-medium text-foreground">
                {app.aiValidation.score}
              </span>
            </span>
            {app.aiValidation.reason && (
              <span className="text-muted-foreground">
                {' '}
                — {app.aiValidation.reason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {isRejected && (
        <div className="flex flex-col gap-0.5 rounded-md bg-destructive/8 px-2.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-destructive">
            <BanIcon className="size-3" />
            Rejected
            {app.rejectedAt && (
              <span className="font-normal text-muted-foreground">
                · {formatDate(app.rejectedAt)}
              </span>
            )}
          </div>
          {app.rejectionReason && (
            <p className="text-muted-foreground">{app.rejectionReason}</p>
          )}
        </div>
      )}

      {/* Hired banner */}
      {isHired && app.hiredAt && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-100/60 px-2.5 py-2 text-xs dark:bg-emerald-900/20">
          <UserCheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            Hired
          </span>
          <span className="text-muted-foreground">
            · {formatDate(app.hiredAt)}
          </span>
        </div>
      )}

      {/* Activity trail — collapsible, hidden for untouched pending apps */}
      {!isPending && (
        <details className="group rounded-md border bg-muted/30">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRightIcon className="size-3 transition-transform group-open:rotate-90" />
            Activity log
          </summary>
          <div className="px-3 pb-3">
            <ActivityTimeline
              resourceType="application"
              resourceId={app._id}
              compact
            />
          </div>
        </details>
      )}
    </div>
  );
}
