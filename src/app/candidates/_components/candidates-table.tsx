import {
  ComposeEmailSheet,
  type ComposeMode,
} from '@/app/emails/_components/compose-email-sheet';
import { buildCandidateComposeMode } from '@/app/emails/_utils/candidate-compose';
import { ChangeJobDialog } from '@/components/change-job-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import {
  ScheduleInterviewDialog,
  type ScheduleInterviewInput,
} from '@/components/schedule-interview-dialog';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { useSocketRoom } from '@/hooks/use-socket-room';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { DEFAULT_TIMEZONE, zonedWallClockToUtc } from '@/lib/timezones';
import { cn, formatDate, sortableTime, timeAgo } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useAuthStore } from '@/store/slices/auth.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import { useUserStore } from '@/store/slices/users.store';
import type {
  Application,
  Candidate,
  CandidateStatus,
  Interview,
  Job,
} from '@/store/types';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowRightLeftIcon,
  ArrowUpDownIcon,
  BanIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  GitCommitHorizontalIcon,
  Loader2Icon,
  MailIcon,
  MousePointerClickIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserMinusIcon,
  UserCheckIcon,
  XIcon,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { avatarBg, getFitConfig } from '../_utils/candidate-styles';
import { CandidateDetailSheet } from './candidate-detail-sheet';

const HEADER_CLS =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';
const SORT_BTN_CLS =
  '-ml-2 h-7 gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground';

/**
 * Run an array of async tasks with bounded concurrency, returning a
 * PromiseSettledResult for each in the original order. Prevents a large
 * bulk selection from firing hundreds of simultaneous requests.
 */
async function runAllWithConcurrency<T>(
  tasks: (() => Promise<T>)[] = [],
  limit = 8
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next;
      next += 1;
      if (i >= tasks.length) break;
      const task = tasks[i];
      try {
        results[i] = { status: 'fulfilled', value: await task() };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }
  const workerCount = Math.min(limit, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export function ColHeader({
  children,
  label,
  icon,
}: {
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className={HEADER_CLS}>
      {icon}
      {children ?? label}
    </span>
  );
}

export function SortHeader({
  column,
  label,
}: {
  column: Column<Candidate>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={SORT_BTN_CLS}
      onClick={() => column.toggleSorting()}
    >
      {label} <ArrowUpDownIcon className="size-3" />
    </Button>
  );
}

export function CandidateCell({ candidate }: { candidate: Candidate }) {
  const bg = avatarBg(candidate.firstName);
  const allUsers = useUserStore(s => s.items);
  const hasCrm = allUsers.some(
    u =>
      u.candidateRef === candidate._id &&
      u.appAccess?.includes('crm') &&
      u.isActive
  );
  return (
    <div className="flex items-center gap-3 min-w-0">
      {candidate.avatar ? (
        <img
          src={candidate.avatar}
          alt={`${candidate.firstName} ${candidate.lastName}`}
          className="size-8 rounded-md object-cover shrink-0"
        />
      ) : (
        <div
          className={cn(
            'size-8 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 select-none',
            bg
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight truncate flex items-center gap-1">
          {candidate.firstName} {candidate.lastName}
          {hasCrm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 rounded-full border border-pine-teal-500/30 bg-pine-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-pine-teal-700 dark:bg-pine-teal-950/40 dark:text-pine-teal-400 shrink-0 select-none">
                  <ShieldCheckIcon className="size-2.5" />
                  CRM
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                CRM access active
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.inTalentPool && (
            <Tooltip>
              <TooltipTrigger asChild>
                <StarIcon className="size-3 shrink-0 fill-violet-400 text-violet-400 cursor-default" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                In Talent Pool
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.eligibilityStatus === 'permanently_ineligible' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center shrink-0 rounded-full border border-red-500/30 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400 select-none">
                  INELIGIBLE
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Permanently Ineligible
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.legalHold && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center shrink-0 rounded-full border border-amber-500/30 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 select-none">
                  HOLD
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Legal hold
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {candidate.email}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{candidate.yearsOfExperience} yrs exp</span>
          {candidate.currentSalaryUSD != null && (
            <span className="text-[11px] font-medium text-foreground/80">
              ·{' '}
              {`$${(candidate.currentSalaryUSD / 1000).toFixed(candidate.currentSalaryUSD % 1000 === 0 ? 0 : 1)}K`}
              /mo
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function AiScoreCell({ candidate }: { candidate: Candidate }) {
  // TYPE 2: job-fit scoring (approved/pipeline candidates)
  const scoring = candidate.aiScore;
  const hasScoring =
    !!scoring && scoring.score != null && scoring.recommendation != null;

  // TYPE 1: candidacy validation / authenticity check (pending candidates)
  const validation = candidate.aiValidation;
  const hasValidation = !!validation && validation.score != null;

  if (hasScoring) {
    const score = scoring.score as number;
    const { recommendation } = scoring;
    const { label } = getFitConfig(recommendation);
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'inline-flex items-center justify-center size-9 rounded-full text-xs font-bold tabular-nums',
            score >= 80
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : score >= 60
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : score >= 40
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {score}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-default border-b border-dotted border-muted-foreground/40">
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-48">
            Score: {score}/100 — {label}
            {scoring.summary && (
              <p className="mt-1 opacity-70">{scoring.summary}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (hasValidation) {
    const { score, isValid, reason } = validation!;
    return (
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'inline-flex items-center justify-center size-9 rounded-full text-xs font-bold tabular-nums',
            isValid
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {score}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-default border-b border-dotted border-muted-foreground/40">
              {isValid ? 'Valid' : 'Invalid'}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-56">
            <p>
              Candidacy: {isValid ? 'Valid' : 'Invalid'} — Score: {score}/100
            </p>
            {reason && <p className="mt-1 opacity-70">{reason}</p>}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

function CurrentRoleCell({ candidate }: { candidate: Candidate }) {
  const exp = candidate.parsedData?.experience?.[0];
  const role = exp?.title?.trim();
  const company = exp?.company?.trim();
  const duration = exp?.duration?.trim();

  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm text-foreground leading-tight whitespace-normal">
        {role}
      </span>
      {company && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal mt-0.5">
          {company}
        </span>
      )}
      {duration && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal mt-0.5 tp-duration">
          {duration}
        </span>
      )}
    </div>
  );
}

function SkillsCell({ candidate }: { candidate: Candidate }) {
  const skills = candidate.parsedData?.skills ?? [];
  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const MAX = 3;
  const visible = skills.slice(0, MAX);
  const overflow = skills.length - MAX;
  return (
    <div className="flex items-center gap-1 flex-wrap min-w-0 max-w-48">
      {visible.map(skill => (
        <span
          key={skill}
          className="inline-flex items-center h-5 rounded-md border px-1.5 text-xs leading-none text-muted-foreground bg-muted/40 max-w-full"
        >
          <span className="truncate">{skill}</span>
        </span>
      ))}
      {overflow > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 h-5 shrink-0 rounded-md border px-1.5 text-xs leading-none text-muted-foreground bg-muted/40 cursor-default border-dashed">
              +{overflow} more
              <MousePointerClickIcon className="size-3 text-warning" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="p-2.5 max-w-72">
            <div className="flex flex-wrap gap-1">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center min-h-5 rounded-md border border-current/25 px-1.5 text-xs leading-snug text-current/85 whitespace-normal wrap-break-word"
                >
                  {s}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className="px-4 py-3">
              <Skeleton className={cn('h-4', j === 0 ? 'w-36' : 'w-20')} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function PipelineStageSelectCell({
  applicationId,
  stageId,
  assignedAt,
  stages,
  onOpenChange,
}: {
  applicationId: string;
  stageId: string;
  assignedAt?: string;
  stages: NonNullable<Job['pipeline']>['stages'];
  onOpenChange?: (open: boolean) => void;
}) {
  const appStore = useApplicationStore();
  const [changing, setChanging] = useState(false);

  async function handleChange(newStageId: string) {
    if (newStageId === stageId) return;
    setChanging(true);
    try {
      await appStore.moveStage(applicationId, newStageId);
      toast.success('Pipeline stage updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChanging(false);
    }
  }

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-1"
      onClick={e => e.stopPropagation()}
    >
      <Select
        value={stageId}
        onValueChange={handleChange}
        onOpenChange={onOpenChange}
        disabled={changing || stages.length === 0}
      >
        <SelectTrigger
          size="sm"
          className="w-full min-w-40 max-w-64 min-h-8 items-start whitespace-normal rounded-sm border border-dashed border-muted-foreground/25 bg-transparent px-1.5 py-1 shadow-none hover:bg-foreground/5 dark:hover:bg-white/5 data-[state=open]:bg-foreground/5 data-[size=sm]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:items-start *:data-[slot=select-value]:whitespace-normal *:data-[slot=select-value]:text-left [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground/50"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border bg-popover shadow-lg ring-1 ring-black/10 dark:ring-white/10">
          {stages
            .filter(s => s.isActive !== false)
            .map(s => (
              <SelectItem key={s._id} value={s._id}>
                <span className="flex items-start gap-2">
                  <span
                    className="size-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="whitespace-normal">{s.name}</span>
                </span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {assignedAt && (
        <span className="text-xs text-muted-foreground pl-0.5">
          {timeAgo(assignedAt)}
        </span>
      )}
    </div>
  );
}

function ReviewActionsDropdown({
  candidate,
  allJobs,
  allApps,
  onMutated,
}: {
  candidate: Candidate;
  allJobs: Job[];
  allApps: Application[];
  onMutated?: () => void;
}) {
  const candStore = useCandidateStore();
  const appStore = useApplicationStore();
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);
  const rejectApp = useApplicationStore(s => s.reject);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');

  const name = `${candidate.firstName} ${candidate.lastName}`;
  const hasJobApplied = !!candidate.appliedJobId;

  // Open jobs the candidate can be approved into.
  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );

  // The candidate's applications, for both the reject routing below and the
  // "another job" flag on the reject dialog.
  const candidateApplications = useMemo(
    () => allApps.filter(a => a.candidateId === candidate._id),
    [allApps, candidate._id]
  );

  /**
   * The application a reject should act on, or null when the candidate holds
   * none.
   *
   * Keyed on PHASE rather than on having a stage: an approved application can
   * have a null `currentStage`, and routing such a candidate to the
   * candidate-level endpoint would be refused (they still hold a live
   * application).
   */
  const liveApplication = useMemo(
    () =>
      candidateApplications.find(
        a => a.phase === 'pending' || a.phase === 'approved'
      ) ?? null,
    [candidateApplications]
  );

  /**
   * How many OTHER applications the candidate still has open. When this is
   * non-zero a reject must not ban or pool them — that would silently destroy
   * the other job's pipeline — so the dialog hides the destination options.
   */
  const otherLiveApplicationCount = useMemo(() => {
    const current = liveApplication;
    const live = candidateApplications.filter(
      a => a.phase === 'pending' || a.phase === 'approved'
    );
    if (!current) return 0;
    return live.filter(a => a._id !== current._id).length;
  }, [candidateApplications, liveApplication]);

  async function handleApprove() {
    const jobId = hasJobApplied ? candidate.appliedJobId! : selectedJobId;
    if (!jobId) {
      toast.error('Please select a job to assign this candidate to');
      return;
    }
    setActing(true);
    try {
      await candStore.approve(candidate._id, jobId);
      toast.success(`${name} approved`);
      setApproveOpen(false);
      setSelectedJobId('');
      // Re-read applications so the new application reaches the store (and
      // therefore the In Pipeline tab's derived id set) without waiting for the
      // `application:created` socket event. `fetchScopedMerge` is the one that
      // writes: `appStore.fetch({limit: 9999})` carries no explicit filter and
      // the post-boot guard makes it a no-op.
      await appStore.fetchScopedMerge({ limit: 9999 });
      onMutated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  /**
   * Reject an In Review candidate.
   *
   * Normally they hold no application, so this goes through the
   * candidate-level endpoint. If they DO hold a live application they are
   * really a pipeline candidate — the candidate endpoint refuses with a 409
   * ("still has an active application") because applying a destination there
   * would ban or pool them platform-wide and destroy every other job's
   * pipeline. Route to that application instead, which removes them from just
   * that job. Same rule the detail sheet applies. Reachable when a candidate
   * is restored from Ineligible while a previous application is still live.
   */
  async function handleReject(payload: RejectPayload) {
    setActing(true);
    try {
      if (liveApplication) {
        await rejectApp(liveApplication._id, payload);
      } else {
        await rejectCandidateStore(candidate._id, {
          rejectionReasonId: payload.rejectionReasonId,
          ...(payload.destination ? { destination: payload.destination } : {}),
          ...(payload.internalNotes
            ? { internalNotes: payload.internalNotes }
            : {}),
        });
      }
      toast.success(
        `${name} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectOpen(false);
      onMutated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleTalentPool() {
    setActing(true);
    try {
      await candStore.updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${name} removed from talent pool`
          : `${name} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${name}`}
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Decide
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting || (!hasJobApplied && openJobs.length === 0)}
            onClick={() => {
              setSelectedJobId(candidate.appliedJobId || '');
              setApproveOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-green-100 dark:bg-green-900/30 shrink-0">
              <CheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Approve</span>
              <span className="text-[11px] text-muted-foreground">
                {hasJobApplied
                  ? 'Create application for applied job'
                  : 'Choose a job to approve into'}
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting}
            onClick={() => setRejectOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                {liveApplication
                  ? 'Remove from this job only'
                  : 'Choose a reason and destination'}
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Talent Pool
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={acting}
            onClick={handleTalentPool}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <StarIcon className="size-3.5 text-amber-700 dark:text-amber-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">
                {candidate.inTalentPool
                  ? 'Remove from Talent Pool'
                  : 'Add to Talent Pool'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {candidate.inTalentPool
                  ? 'Remove from saved candidates'
                  : 'Save for future opportunities'}
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Communication
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setComposeOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <MailIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Email</span>
              <span className="text-[11px] text-muted-foreground">
                Compose and send an email
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={{
          type: 'prefill',
          to: candidate.email,
          subject: '',
          body: '',
          templateType: 'general',
          context: { type: 'general', candidateId: candidate._id },
          variables: {
            candidateName: name,
            candidateEmail: candidate.email,
            candidatePhone: candidate.phone ?? '',
            jobTitle: '',
            clientName: '',
            currentStage: '',
            senderName: (() => {
              const u = useAuthStore.getState().user;
              return u ? `${u.firstName} ${u.lastName}`.trim() : '';
            })(),
          },
        }}
      />

      <Dialog
        open={approveOpen}
        onOpenChange={v => {
          if (!v) setApproveOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve {name}</DialogTitle>
            <DialogDescription>
              {hasJobApplied
                ? 'This will approve the candidate and create an application for the job they applied to. AI scoring will run automatically.'
                : 'This candidate did not apply through a job posting. Choose the job to approve them into — an application is created at the first pipeline stage.'}
            </DialogDescription>
          </DialogHeader>
          {!hasJobApplied && (
            <div className="space-y-3">
              <Label>Select Job</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={acting || (hasJobApplied ? false : !selectedJobId)}
            >
              {acting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject — routes by scope. A candidate with no live application is
          rejected at candidate level (the destination is always offered, spec
          §4.8). One that still holds a live application is rejected at
          application level, which removes them from that job only — the dialog
          then hides the destination options. */}
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        candidateName={name}
        jobTitle={
          liveApplication
            ? allJobs.find(j => j._id === liveApplication.jobId)?.title
            : candidate.appliedJobId
              ? allJobs.find(j => j._id === candidate.appliedJobId)?.title
              : undefined
        }
        currentStageName={liveApplication?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={handleReject}
      />
    </>
  );
}

function PipelineActionsMenu({
  candidate,
  allApps,
  allJobs,
}: {
  candidate: Candidate;
  allApps: Application[];
  allJobs: Job[];
}) {
  const appStore = useApplicationStore();
  const candStore = useCandidateStore();
  const createInterviewForApplication = useInterviewStore(
    s => s.createForApplication
  );
  // Scoped to ATS staff — the boot-loaded user list also holds CRM-only
  // accounts (client/va) and deactivated users, which showed up here as
  // interviewers who are not part of the team.
  const { interviewers } = useInterviewerOptions();
  const users = useMemo(
    () =>
      interviewers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    [interviewers]
  );

  const candidateApps = useMemo(
    () =>
      allApps.filter(
        a => a.candidateId === candidate._id && a.phase === 'approved'
      ),
    [allApps, candidate._id]
  );
  const allCandidateApps = useMemo(
    () => allApps.filter(a => a.candidateId === candidate._id),
    [allApps, candidate._id]
  );
  const application = candidateApps[0];
  const job = useMemo(
    () => allJobs.find(j => j._id === application?.jobId),
    [allJobs, application?.jobId]
  );
  const stages = job?.pipeline?.stages ?? [];

  const [stageOpen, setStageOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [changeJobOpen, setChangeJobOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [acting, setActing] = useState(false);
  const settings = useSettingsStore(s => s.settings);
  const companyTimezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );
  const stageSelectRef = useRef<HTMLButtonElement>(null);

  const name = `${candidate.firstName} ${candidate.lastName}`;

  /**
   * Every job this candidate already holds an application for, in any phase.
   * The (candidateId, jobId) index is unique regardless of phase, so adding a
   * duplicate is rejected by the backend with `409 CANDIDATE_ALREADY_APPLIED`.
   * The reassign picker disables these rather than letting the user hit that.
   */
  const heldJobIds = useMemo(
    () => new Set(allCandidateApps.map(a => a.jobId)),
    [allCandidateApps]
  );

  /**
   * Open jobs with their active pipeline stages, for the ChangeJobDialog job
   * picker. The stage list is what powers the dialog's optional "Starting
   * stage" choice — without it that section never renders.
   */
  const jobOptionsForActions = useMemo(
    () =>
      openJobs.map(j => ({
        _id: j._id,
        title: j.title,
        stages: (j.pipeline?.stages ?? [])
          .filter(s => s.isActive !== false)
          .sort((a, b) => a.order - b.order)
          .map(s => ({ _id: s._id, name: s.name })),
      })),
    [openJobs]
  );

  /**
   * Live applications the candidate holds on other jobs. When non-zero the
   * reject dialog hides the destination options, because banning or pooling
   * them here would silently destroy that other job's pipeline.
   */
  const otherLiveApplicationCount = allCandidateApps.filter(
    a =>
      a._id !== application?._id &&
      (a.phase === 'pending' || a.phase === 'approved')
  ).length;

  // Compose email prefill for this candidate
  function buildComposeMode() {
    return {
      type: 'prefill' as const,
      to: candidate.email,
      subject: '',
      body: '',
      templateType: 'general',
      context: application
        ? {
            type: 'general',
            candidateId: candidate._id,
            applicationId: application._id,
            jobId: application.jobId,
          }
        : { type: 'general', candidateId: candidate._id },
      variables: {
        candidateName: name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone ?? '',
        jobTitle: job?.title ?? '',
        clientName: job
          ? (useClientStore.getState().items.find(c => c._id === job.clientId)
              ?.companyName ?? '')
          : '',
        currentStage: application?.currentStage?.stageName ?? '',
        senderName: (() => {
          const u = useAuthStore.getState().user;
          return u ? `${u.firstName} ${u.lastName}`.trim() : '';
        })(),
      },
    };
  }

  async function handleMoveStage() {
    if (!application || !selectedStageId) return;
    // Defensive: the dialog pre-selects the current stage, and re-sending it
    // would rewrite `currentStage.assignedAt` (resetting the stage age shown in
    // the Stage column) while logging a `from === to` activity row. The confirm
    // button is disabled for this case; this guard covers a race where the
    // application moves underneath an open dialog.
    if (selectedStageId === application.currentStage?.stageId) {
      setStageOpen(false);
      return;
    }
    setActing(true);
    try {
      await appStore.moveStage(application._id, selectedStageId);
      toast.success(`${name} moved to stage`);
      setStageOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleHire() {
    if (!application) return;
    setActing(true);
    try {
      await appStore.hire(application._id);
      toast.success(`${name} hired`);
      setHireOpen(false);
      await candStore.fetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleTalentPool() {
    setActing(true);
    try {
      await candStore.updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      toast.success(
        candidate.inTalentPool
          ? `${name} removed from talent pool`
          : `${name} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleReject(payload: RejectPayload) {
    if (!application) return;
    setActing(true);
    try {
      await appStore.reject(application._id, payload);
      toast.success(
        `${name} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  /** Add a second job alongside the current one (the current app stays open). */
  async function handleAddAnotherJob(jobId: string, startStageId?: string) {
    setActing(true);
    try {
      await candStore.assignJob(candidate._id, jobId, startStageId);
      toast.success(`${name} added to another job`);
      setReassignOpen(false);
      await appStore.fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  /**
   * Change job — the chosen job REPLACES the current one. The existing
   * application is closed and a new one opened, because `jobId` is part of the
   * application's unique key and cannot be edited in place. Distinct from
   * "Add to Another Job", which keeps the current application.
   */
  async function handleChangeJob(jobId: string, startStageId?: string) {
    if (!application) return;
    setActing(true);
    try {
      const target = allJobs.find(j => j._id === jobId);
      await candStore.changeJob(candidate._id, {
        applicationId: application._id,
        targetJobId: jobId,
        startStageId,
      });
      toast.success(`${name} moved to ${target?.title ?? 'the new job'}`);
      setChangeJobOpen(false);
      // Re-read applications so the Job/Stage columns reflect the closed and
      // newly created applications immediately. `fetch()` would be a no-op here
      // (the store skips it after boot when items are loaded and no explicit
      // filter is passed), and `fetchScoped` only returns rows without merging
      // them — so `fetchScopedMerge` is the one that actually updates the store.
      await appStore.fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleScheduleInterview(data: ScheduleInterviewInput) {
    if (!application) return;
    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    setActing(true);
    try {
      // `data.scheduledAt` is a wall clock from the dialog; interpret it in the
      // company timezone, which is the zone the form displays.
      const scheduledAt = zonedWallClockToUtc(
        data.scheduledAt.slice(0, 10),
        data.scheduledAt.slice(11, 16),
        companyTimezone
      );
      if (!scheduledAt) {
        toast.error('Please enter a valid date and time');
        return;
      }
      await createInterviewForApplication(application._id, {
        title: data.title,
        type: data.type as Interview['type'],
        jobId: data.jobId || undefined,
        scheduledAt,
        // Empty is valid — the backend falls back to the organiser.
        interviewerIds: data.interviewerIds,
        meetingDetails: {
          link: data.meetingLink || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
        },
      });
      toast.success('Interview scheduled');
      setScheduleOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={acting}
            aria-label={`Actions for ${name}`}
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Stage
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={stages.length === 0 || !application}
            onClick={() => {
              setSelectedStageId(
                application?.currentStage?.stageId ?? stages[0]?._id ?? ''
              );
              setStageOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-violet-100 dark:bg-violet-900/30 shrink-0">
              <GitCommitHorizontalIcon className="size-3.5 text-violet-600 dark:text-violet-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Move Stage</span>
              <span className="text-[11px] text-muted-foreground">
                Advance through pipeline
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Hiring
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application}
            onClick={() => setHireOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-green-100 dark:bg-green-900/30 shrink-0">
              <UserCheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Hire</span>
              <span className="text-[11px] text-muted-foreground">
                Mark as hired for this job
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application || acting}
            onClick={() => setScheduleOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
              <CalendarIcon className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Schedule Interview</span>
              <span className="text-[11px] text-muted-foreground">
                Book and invite interviewers
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={!application}
            onClick={() => setRejectOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                {otherLiveApplicationCount > 0
                  ? 'Remove from this job only'
                  : 'Reject & close this application'}
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Communication
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setComposeOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <MailIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Email Candidate</span>
              <span className="text-[11px] text-muted-foreground">
                Compose and send an email
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Jobs &amp; Pool
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setChangeJobOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <ArrowRightLeftIcon className="size-3.5 text-orange-600 dark:text-orange-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Change Job</span>
              <span className="text-[11px] text-muted-foreground">
                Move to a different job
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={openJobs.length === 0 || acting}
            onClick={() => setReassignOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-teal-100 dark:bg-teal-900/30 shrink-0">
              <PlusIcon className="size-3.5 text-teal-600 dark:text-teal-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Add to Another Job</span>
              <span className="text-[11px] text-muted-foreground">
                Add another job alongside the current one
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setTalentPoolConfirmOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <StarIcon className="size-3.5 text-amber-700 dark:text-amber-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">
                {candidate.inTalentPool
                  ? 'Remove from Talent Pool'
                  : 'Add to Talent Pool'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {candidate.inTalentPool
                  ? 'Remove from saved candidates'
                  : 'Save for future opportunities'}
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Compose Email Sheet */}
      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        mode={buildComposeMode()}
      />

      {/* Move Stage Dialog */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move Stage</DialogTitle>
            <DialogDescription>
              Advance <span className="font-medium">{name}</span> to the next
              pipeline stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Stage</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger ref={stageSelectRef}>
                <SelectValue placeholder="Choose a stage..." />
              </SelectTrigger>
              <SelectContent>
                {stages
                  .filter(s => s.isActive !== false)
                  .map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMoveStage}
              disabled={
                !selectedStageId ||
                acting ||
                selectedStageId === application?.currentStage?.stageId
              }
            >
              {acting ? 'Moving…' : 'Move Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hire Confirm Dialog */}
      <Dialog open={hireOpen} onOpenChange={setHireOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hire Candidate</DialogTitle>
            <DialogDescription>
              Mark <span className="font-medium">{name}</span> as hired for{' '}
              <span className="font-medium">{job?.title ?? 'this job'}</span>?
              This completes the pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHire} disabled={acting}>
              {acting ? 'Hiring…' : 'Confirm Hire'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog — structured reason + destination */}
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        candidateName={name}
        jobTitle={job?.title}
        currentStageName={application?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={acting}
        onConfirm={handleReject}
      />

      {/* Change Job — replaces the current job; the old application closes. */}
      <ChangeJobDialog
        open={changeJobOpen}
        onOpenChange={setChangeJobOpen}
        mode="change"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptionsForActions}
        submitting={acting}
        onConfirm={handleChangeJob}
      />

      {/* Add to Another Job — keeps the current job and adds a second one. */}
      <ChangeJobDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        mode="add"
        candidateName={name}
        currentJobId={job?._id}
        currentJobTitle={job?.title}
        jobs={jobOptionsForActions.filter(j => !heldJobIds.has(j._id))}
        submitting={acting}
        onConfirm={handleAddAnotherJob}
      />

      {/* Schedule Interview — keyed by candidate so the form re-seeds when a
          different row's menu is used. */}
      <ScheduleInterviewDialog
        key={candidate._id}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={handleScheduleInterview}
        candidateName={name}
        job={job ?? null}
        jobs={openJobs.map(j => ({ _id: j._id, title: j.title }))}
        users={users}
        loading={acting}
      />

      {/* Talent Pool Confirm */}
      <Dialog
        open={talentPoolConfirmOpen}
        onOpenChange={setTalentPoolConfirmOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {candidate.inTalentPool
                ? 'Remove from Talent Pool'
                : 'Add to Talent Pool'}
            </DialogTitle>
            <DialogDescription>
              {candidate.inTalentPool ? (
                <>
                  Remove <span className="font-medium">{name}</span> from the
                  talent pool? They will no longer appear in saved candidates.
                </>
              ) : (
                <>
                  Add <span className="font-medium">{name}</span> to the talent
                  pool? They will be saved for future opportunities.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTalentPoolConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setTalentPoolConfirmOpen(false);
                handleTalentPool();
              }}
              disabled={acting}
            >
              {candidate.inTalentPool ? 'Remove' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Tabs this page actually renders. Hired deliberately has its own page
 * (`/ats/hired`), so it is not a value here — narrowing the type is what keeps
 * the `isHired` branches from silently coming back.
 */
type TabValue = Extract<CandidateStatus, 'pending' | 'approved'>;

const CANDIDATE_SORT_OPTIONS = [
  'newest',
  'oldest',
  'a_z',
  'z_a',
  'highest_score',
  'lowest_score',
] as const;
type CandidateSortOption = (typeof CANDIDATE_SORT_OPTIONS)[number];

const CANDIDATE_SORT_LABELS: Record<CandidateSortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  a_z: 'Name A → Z',
  z_a: 'Name Z → A',
  highest_score: 'Highest AI score',
  lowest_score: 'Lowest AI score',
};

function TabCountChip({ n }: { n: number }) {
  return (
    <Badge
      variant="outline"
      className="h-4 px-1.5 text-[10px] rounded-full border-border font-medium"
    >
      {n}
    </Badge>
  );
}

export function CandidatesTable() {
  // ── Store subscriptions ──────────────────────────────────────────
  const items = useCandidateStore(s => s.items);
  const loading = useCandidateStore(s => s.loading);
  const isRefreshing = useCandidateStore(s => s.isRefreshing);
  const mutating = useCandidateStore(s => s.mutating);
  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);

  const allApps = useApplicationStore(s => s.items);
  const moveStageApp = useApplicationStore(s => s.moveStage);
  const rejectApp = useApplicationStore(s => s.reject);
  const moveAppToTalentPool = useApplicationStore(s => s.moveToTalentPool);

  const allJobs = useJobStore(s => s.items);
  const allClients = useClientStore(s => s.items);

  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [openStageRowId, setOpenStageRowId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [sortBy, setSortBy] = useState<CandidateSortOption>(() => {
    const raw = localStorage.getItem('candidates-sort-by') ?? '';
    return (CANDIDATE_SORT_OPTIONS as readonly string[]).includes(raw)
      ? (raw as CandidateSortOption)
      : 'newest';
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId') ?? '';
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [bulkStageId, setBulkStageId] = useState('');
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkPoolMoveOpen, setBulkPoolMoveOpen] = useState(false);
  const [bulkActing, setBulkActing] = useState(false);
  const [bulkComposeOpen, setBulkComposeOpen] = useState(false);
  const [bulkComposeMode, setBulkComposeMode] = useState<ComposeMode>({
    type: 'new',
  });

  // Subscribe to real-time candidate and application updates
  useSocketRoom('candidates');
  useSocketRoom('applications');

  // Shared pagination state (see use-table-pagination). Behaviour is identical
  // to the per-table implementation it replaces: 20-row default, same size list,
  // `sessionStorage` index and `localStorage` size.
  const { pageIndex, pageSize, handlePaginationChange, resetPage } =
    useTablePagination({ storageKey: 'candidates', defaultSize: 20 });

  // Debounced search ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // After boot, all candidates are already in the store. No fetch needed —
  // we filter client-side by activeTab instead of making server calls.

  // ── Derived maps from shared app/job/client stores ───────────────

  // candidateId → { jobTitle, clientName }[] for the Job column.
  //
  // Only live and hired applications count. A rejected application stays in the
  // database for history, so without this filter the column would keep showing
  // jobs the candidate was already rejected from — and after a job change it
  // would list the old job alongside the new one.
  const jobInfosByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const clientNameById = new Map(allClients.map(c => [c._id, c.companyName]));
    const map = new Map<string, { jobTitle: string; clientName: string }[]>();
    for (const a of allApps) {
      if (a.phase === 'rejected') continue;
      const job = jobById.get(a.jobId);
      const title = job?.title ?? a.jobId;
      const clientName = job
        ? (clientNameById.get(job.clientId) ?? job.clientId)
        : '';
      const infos = map.get(a.candidateId) ?? [];
      if (!infos.some(i => i.jobTitle === title)) {
        infos.push({ jobTitle: title, clientName });
      }
      map.set(a.candidateId, infos);
    }
    return map;
  }, [allApps, allJobs, allClients]);

  // candidateId → { stageName, stageColor, assignedAt } for the Pipeline tab.
  // Only approved-phase applications count — rejected apps retain their last
  // currentStage for audit purposes but must not show in the pipeline tab.
  const stageInfoByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const map = new Map<
      string,
      {
        stageName: string;
        stageColor: string;
        stageId: string;
        assignedAt: string;
        applicationId: string;
        stages: NonNullable<Job['pipeline']>['stages'];
      }
    >();
    for (const a of allApps) {
      if (a.phase !== 'approved' || !a.currentStage || map.has(a.candidateId))
        continue;
      const job = jobById.get(a.jobId);
      const stage = job?.pipeline?.stages?.find(
        s => s._id === a.currentStage!.stageId
      );
      map.set(a.candidateId, {
        stageName: a.currentStage.stageName,
        stageColor: stage?.color ?? '#3b82f6',
        stageId: a.currentStage.stageId,
        assignedAt: a.currentStage.assignedAt,
        applicationId: a._id,
        stages: job?.pipeline?.stages ?? [],
      });
    }
    return map;
  }, [allApps, allJobs]);

  // candidateId → pending application id (for the In Review tab's reject action).
  const pendingApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (a.phase === 'pending' && !map.has(a.candidateId)) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  /**
   * candidateId → id of ANY live application (pending or approved).
   *
   * Used to decide the reject endpoint. Keyed on phase rather than on having a
   * stage, because an approved application can have a null `currentStage` — and
   * routing that candidate to the candidate-level endpoint would be rejected
   * (they still hold a live application), producing a silent bulk failure.
   */
  const liveApplicationByCandidateId = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allApps) {
      if (
        (a.phase === 'pending' || a.phase === 'approved') &&
        !map.has(a.candidateId)
      ) {
        map.set(a.candidateId, a._id);
      }
    }
    return map;
  }, [allApps]);

  // ── Helpers ──────────────────────────────────────────────────────

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab);
    resetPage();
    setSorting([{ id: 'createdAt', desc: true }]);
    const defaultSort: CandidateSortOption = 'newest';
    setSortBy(defaultSort);
    localStorage.setItem('candidates-sort-by', defaultSort);
  }

  function handleSortChange(opt: CandidateSortOption) {
    setSortBy(opt);
    localStorage.setItem('candidates-sort-by', opt);
    resetPage();
  }

  function handleSearchChange(q: string) {
    // Update input immediately for responsive typing
    setInputValue(q);
    // Debounce the actual search query to avoid hammering the server
    if (searchTimer.current) clearTimeout(searchTimer.current);
    resetPage();
    searchTimer.current = setTimeout(() => {
      setQuery(q);
    }, 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  function openDetail(candidate: Candidate) {
    setSelected(candidate);
    setDetailOpen(true);
  }

  // Set of candidateIds who have at least one ACTIVE (approved-phase) application.
  // This is the source of truth for the "In Pipeline" tab — a candidate whose
  // only applications are rejected must not appear there even if their
  // candidate-level status hasn't been updated yet by the backend.
  const candidatesInPipelineIds = useMemo(
    () =>
      new Set(
        allApps.filter(a => a.phase === 'approved').map(a => a.candidateId)
      ),
    [allApps]
  );

  // Defensive fallback: if the application-store derived set is unexpectedly
  // empty while there are candidates with status 'approved' in the candidate
  // store, the application store has likely been corrupted by a lightweight
  // socket broadcast (e.g. triggered by a public apply).  Fall back to
  // candidate-level status so the Pipeline tab doesn't show zero.
  const pipelineIdsFallback = useMemo(
    () => new Set(items.filter(c => c.status === 'approved').map(c => c._id)),
    [items]
  );
  const effectivePipelineIds = useMemo(() => {
    if (candidatesInPipelineIds.size > 0) return candidatesInPipelineIds;
    if (pipelineIdsFallback.size > 0) return pipelineIdsFallback;
    return candidatesInPipelineIds;
  }, [candidatesInPipelineIds, pipelineIdsFallback]);

  // ── "In Review" membership ──────────────────────────────────────
  // A candidate is In Review when they are still pending AND not already
  // parked somewhere else. The flag exclusions are what make Reject and
  // "Add to Talent Pool" remove the row immediately: neither action changes
  // `status`, so without them the candidate would stay visible in this tab
  // with no remaining work to do.
  //
  // NOTE: public-apply candidates have NO application at this stage — the
  // application is only created at approval (see job.controller.ts). So this
  // rule must stay candidate-level; it cannot be application-derived.
  const isInReview = useCallback(
    (c: Candidate) =>
      c.status === 'pending' &&
      !c.inTalentPool &&
      c.eligibilityStatus !== 'permanently_ineligible',
    []
  );

  // ── Tab counts derived from local data ──────────────────────────
  const counts = useMemo(() => {
    const base = jobIdFilter
      ? (() => {
          const ids = new Set(
            allApps.filter(a => a.jobId === jobIdFilter).map(a => a.candidateId)
          );
          return items.filter(c => ids.has(c._id));
        })()
      : items;
    return {
      pending: base.filter(isInReview).length,
      approved: base.filter(c => effectivePipelineIds.has(c._id)).length,
      hired: base.filter(c => c.status === 'hired').length,
    };
  }, [items, jobIdFilter, allApps, effectivePipelineIds, isInReview]);

  // ── Client-side filtering by tab + search ────────────────────────
  // After boot, ALL candidates are in the store. We filter by activeTab
  // and search query locally — no server round-trip needed.
  const filteredData = useMemo(() => {
    // First filter by active tab
    let result = items.filter(c => {
      if (activeTab === 'approved') {
        return effectivePipelineIds.has(c._id);
      }
      if (activeTab === 'pending') {
        return isInReview(c);
      }
      return c.status === activeTab;
    });

    // Filter by job if jobId URL param is present
    if (jobIdFilter) {
      const candidateIdsForJob = new Set(
        allApps.filter(a => a.jobId === jobIdFilter).map(a => a.candidateId)
      );
      result = result.filter(c => candidateIdsForJob.has(c._id));
    }

    // Then apply search
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        if (fullName.includes(q)) return true;
        if (c.email?.toLowerCase().includes(q)) return true;
        if (c.phone?.toLowerCase().includes(q)) return true;
        const skills = (c.parsedData?.skills ?? []).join(' ').toLowerCase();
        if (skills.includes(q)) return true;
        const exp = c.parsedData?.experience?.[0];
        if (exp?.title?.toLowerCase().includes(q)) return true;
        if (exp?.company?.toLowerCase().includes(q)) return true;
        if (c.appliedJobId?.toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return result;
  }, [
    items,
    query,
    activeTab,
    jobIdFilter,
    allApps,
    effectivePipelineIds,
    isInReview,
  ]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aTime = sortableTime(a.createdAt);
      const bTime = sortableTime(b.createdAt);
      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      const aScore = a.aiScore?.score ?? a.aiValidation?.score ?? -1;
      const bScore = b.aiScore?.score ?? b.aiValidation?.score ?? -1;
      switch (sortBy) {
        case 'newest':
          return bTime - aTime;
        case 'oldest':
          return aTime - bTime;
        case 'a_z':
          return aName.localeCompare(bName);
        case 'z_a':
          return bName.localeCompare(aName);
        case 'highest_score':
          return bScore !== aScore ? bScore - aScore : bTime - aTime;
        case 'lowest_score':
          return aScore !== bScore ? aScore - bScore : bTime - aTime;
      }
    });
  }, [filteredData, sortBy]);

  // Client-side pagination
  const pagedData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  const data = pagedData;
  const totalRows = filteredData.length;

  // ── Bulk selection helpers ───────────────────────────────────────
  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredData.length > 0 && filteredData.every(c => selectedIds.has(c._id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected =
        filteredData.length > 0 && filteredData.every(c => prev.has(c._id));
      if (allSelected) return new Set();
      return new Set(filteredData.map(c => c._id));
    });
  }, [filteredData]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Clear selection whenever the effective filter changes so stale IDs from a
  // previous tab/search/job can't be accidentally bulk-acted on.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, jobIdFilter, query]);

  // Stages offered by the bulk "Move to Stage" dialog (from the first
  // selected candidate's job pipeline).
  const bulkStageOptions = useMemo(() => {
    const firstId = [...selectedIds][0];
    const info = firstId ? stageInfoByCandidateId.get(firstId) : undefined;
    return (info?.stages ?? []).filter(s => s.isActive !== false);
  }, [selectedIds, stageInfoByCandidateId]);

  // ── Bulk action handlers ─────────────────────────────────────────
  /**
   * Bulk email. Every reachable selected candidate's address goes into the
   * single To list, so one send reaches all of them.
   *
   * A selection can mix candidates with and without an email address; the ones
   * that cannot be reached are reported instead of being silently dropped, and
   * an all-unreachable selection refuses to open the composer at all.
   */
  function openBulkCompose() {
    if (selectedCount === 0) return;
    const selectedRows = items.filter(c => selectedIds.has(c._id));
    const reachable = selectedRows.filter(c => (c.email ?? '').trim());
    if (reachable.length === 0) {
      toast.error('None of the selected candidates has an email address.');
      return;
    }
    const skipped = selectedRows.length - reachable.length;
    if (skipped > 0) {
      toast.info(
        `Emailing ${reachable.length} of ${selectedRows.length} selected — ${skipped} ${skipped === 1 ? 'has' : 'have'} no email address.`
      );
    }
    setBulkComposeMode(buildCandidateComposeMode(reachable));
    setBulkComposeOpen(true);
  }

  async function handleBulkTalentPool() {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => updateTalentPool(id, 'add'))
    );
    setBulkActing(false);
    const ok = results.filter(r => r.status === 'fulfilled').length;
    clearSelection();
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} added to Talent Pool`
      );
    } else {
      toast.error(`Added ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  /**
   * Bulk "Remove from job → Talent Pool".
   *
   * Closes each selected candidate's application for the job in view and parks
   * them in the Talent Pool. Not a rejection: no reason is asked for and none
   * is recorded. When a job filter is active only that job's application is
   * closed; any other job the candidate is on is left alone.
   */
  async function handleBulkMoveToTalentPool() {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => async () => {
        const live = allApps.filter(
          a =>
            a.candidateId === id &&
            (a.phase === 'pending' || a.phase === 'approved')
        );
        const stageAppId = stageInfoByCandidateId.get(id)?.applicationId;
        const target = jobIdFilter
          ? live.find(a => a.jobId === jobIdFilter)
          : (live.find(a => a._id === stageAppId) ?? live[0]);
        if (!target) throw new Error('No live application');
        return moveAppToTalentPool(target._id);
      })
    );
    setBulkActing(false);
    setBulkPoolMoveOpen(false);
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} moved to Talent Pool`
      );
    } else {
      toast.error(`Moved ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  /**
   * Bulk reject.
   *
   * Each candidate is rejected through the endpoint matching their state:
   * In Review candidates have no application yet, so they go through the
   * candidate-level reject; pipeline candidates go through their application.
   *
   * The destination is applied per candidate. In Review candidates always
   * receive it. Pipeline candidates only receive it when this is their last
   * live application — otherwise a plain reject removes them from that job and
   * leaves their other pipelines untouched (spec §4.8).
   */
  async function handleBulkReject(payload: RejectPayload) {
    if (selectedCount === 0) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => {
        // Prefer the live application whenever one exists. Falling back to a
        // stage-derived id would miss approved applications with a null
        // currentStage and wrongly route them to the candidate endpoint.
        const appId =
          liveApplicationByCandidateId.get(id) ??
          (activeTab === 'approved'
            ? stageInfoByCandidateId.get(id)?.applicationId
            : pendingApplicationByCandidateId.get(id));

        // No application at all — a genuine In Review candidate. Reject at
        // candidate level, which is what moves them to Talent Pool/Ineligible.
        if (!appId) {
          return rejectCandidateStore(id, {
            rejectionReasonId: payload.rejectionReasonId,
            ...(payload.destination
              ? { destination: payload.destination }
              : {}),
            ...(payload.internalNotes
              ? { internalNotes: payload.internalNotes }
              : {}),
          });
        }

        // Pipeline — the backend ignores the destination when the candidate
        // still holds another live application, so it is safe to pass through.
        return rejectApp(appId, payload);
      })
    );
    setBulkActing(false);
    setBulkRejectOpen(false);
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(`${ok} ${ok === 1 ? 'candidate' : 'candidates'} rejected`);
    } else {
      toast.error(`Rejected ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  async function handleBulkMoveStage() {
    if (selectedCount === 0 || !bulkStageId) return;
    setBulkActing(true);
    const ids = [...selectedIds];
    const results = await runAllWithConcurrency(
      ids.map(id => () => {
        const info = stageInfoByCandidateId.get(id);
        if (!info || !info.stages.some(s => s._id === bulkStageId)) {
          return Promise.reject(new Error('Stage not available for candidate'));
        }
        return moveStageApp(info.applicationId, bulkStageId);
      })
    );
    setBulkActing(false);
    setBulkStageOpen(false);
    setBulkStageId('');
    clearSelection();
    const ok = results.filter(r => r.status === 'fulfilled').length;
    if (ok === ids.length) {
      toast.success(
        `${ok} ${ok === 1 ? 'candidate' : 'candidates'} moved to stage`
      );
    } else {
      toast.error(`Moved ${ok} of ${ids.length} — some candidates failed`);
    }
  }

  const columns = useMemo<ColumnDef<Candidate>[]>(() => {
    const isPipeline = activeTab === 'approved';

    const stageCol: ColumnDef<Candidate> = {
      id: 'currentStage',
      header: () => <ColHeader>Current Stage</ColHeader>,
      cell: ({ row }) => {
        const info = stageInfoByCandidateId.get(row.original._id);
        if (!info)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <PipelineStageSelectCell
            applicationId={info.applicationId}
            stageId={info.stageId}
            assignedAt={info.assignedAt}
            stages={info.stages}
            onOpenChange={open =>
              setOpenStageRowId(open ? row.original._id : null)
            }
          />
        );
      },
    };

    const roleCol: ColumnDef<Candidate> = {
      id: 'currentRole',
      accessorFn: row => row.parsedData?.experience?.[0]?.title ?? '',
      header: () => <ColHeader>Current Role</ColHeader>,
      cell: ({ row }) => <CurrentRoleCell candidate={row.original} />,
    };

    return [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              allFilteredSelected
                ? true
                : selectedCount > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={() => toggleSelectAll()}
            aria-label="Select all candidates"
          />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(row.original._id)}
              onCheckedChange={() => toggleSelect(row.original._id)}
              aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
            />
          </div>
        ),
        enableSorting: false,
        size: 40,
      },
      {
        id: 'candidate',
        accessorFn: row => `${row.firstName} ${row.lastName}`,
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
      },
      {
        id: 'jobs',
        header: () => <ColHeader>Job Applied</ColHeader>,
        cell: ({ row }) => {
          // Try app-based lookup first (candidates with an application)
          const appInfos = jobInfosByCandidateId.get(row.original._id);
          if (appInfos && appInfos.length > 0) {
            const first = appInfos[0];
            const rest = appInfos.slice(1);
            return (
              <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium whitespace-normal leading-tight">
                    {first.jobTitle}
                  </p>
                  {first.clientName && (
                    <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                      {first.clientName}
                    </p>
                  )}
                </div>
                {rest.length > 0 && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 h-4 cursor-default shrink-0"
                        >
                          +{rest.length}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-xs max-w-56"
                      >
                        {rest.map(i => i.jobTitle).join(', ')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          }
          // Fallback: pending candidates have appliedJobId but no application yet
          const appliedJobId = row.original.appliedJobId;
          if (appliedJobId) {
            const job = allJobs.find(j => j._id === appliedJobId);
            const clientName = job
              ? (allClients.find(c => c._id === job.clientId)?.companyName ??
                '')
              : '';
            return (
              <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-2 py-1 -my-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium whitespace-normal leading-tight">
                    {job?.title ?? appliedJobId}
                  </p>
                  {clientName && (
                    <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                      {clientName}
                    </p>
                  )}
                </div>
              </div>
            );
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      ...(isPipeline ? [stageCol] : [roleCol]),
      {
        id: 'skills',
        accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
        header: () => <ColHeader>Skills</ColHeader>,
        cell: ({ row }) => <SkillsCell candidate={row.original} />,
      },
      {
        id: 'aiScore',
        accessorFn: (row: Candidate) =>
          row.aiScore?.score ?? row.aiValidation?.score ?? -1,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            <SparklesIcon className="size-3" />
            AI Score <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => <AiScoreCell candidate={row.original} />,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            Applied <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        // Icon only, but LEFT-aligned to match the trigger button in the cell
        // below. The previous centred glyph sat roughly 16px to the right of
        // the button, so the header and its column did not read as one unit.
        header: () => (
          <ColHeader icon={<EllipsisIcon className="size-3.5" />} />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            {isPipeline ? (
              <PipelineActionsMenu
                candidate={row.original}
                allApps={allApps}
                allJobs={allJobs}
              />
            ) : (
              <ReviewActionsDropdown
                candidate={row.original}
                allJobs={allJobs}
                allApps={allApps}
              />
            )}
          </div>
        ),
      },
    ];
  }, [
    activeTab,
    jobInfosByCandidateId,
    stageInfoByCandidateId,
    allApps,
    allJobs,
    allClients,
    selectedIds,
    selectedCount,
    allFilteredSelected,
    toggleSelect,
    toggleSelectAll,
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const hasFilters = inputValue.length > 0;

  return (
    <>
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        {/* Tabs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-wrap shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={v => handleTabChange(v as TabValue)}
          >
            <TabsList>
              {[
                {
                  value: 'pending' as const,
                  label: 'In Review',
                  count: counts.pending,
                },
                {
                  value: 'approved' as const,
                  label: 'In Pipeline',
                  count: counts.approved,
                },
              ].map(({ value, label, count }) => (
                <TabsTrigger key={value} value={value}>
                  {label} <TabCountChip n={count} />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Toolbar */}
          <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
            <div className="relative min-w-48 max-w-sm flex-1 sm:flex-none">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search candidates..."
                value={inputValue}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-8 pr-8 h-9"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 size-7"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <XIcon className="size-3.5" />
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 gap-1.5 rounded-full text-xs border-dashed',
                    sortBy !== 'newest' &&
                      'border-solid border-primary text-primary'
                  )}
                >
                  <ArrowUpDownIcon className="size-3" />
                  {CANDIDATE_SORT_LABELS[sortBy]}
                  <ChevronDownIcon className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CANDIDATE_SORT_OPTIONS.map(opt => (
                  <DropdownMenuItem
                    key={opt}
                    onSelect={() => handleSortChange(opt)}
                    className={cn(
                      'text-sm',
                      sortBy === opt && 'font-medium text-primary'
                    )}
                  >
                    {CANDIDATE_SORT_LABELS[opt]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigate('/ats/candidates/quick-import')}
                  >
                    <PlusIcon />
                    Add Candidate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add a new candidate</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-1 shrink-0">
          {loading && data.length === 0
            ? 'Loading…'
            : isRefreshing
              ? 'Refreshing…'
              : `${totalRows} ${totalRows === 1 ? 'candidate' : 'candidates'}${hasFilters ? ' found' : ' total'}`}
        </p>

        {/* Bulk selection bar */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>

            {activeTab === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkStageOpen(true)}
              >
                <GitCommitHorizontalIcon className="size-4" />
                Move to Stage
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRejectOpen(true)}
            >
              <BanIcon className="size-4" />
              Reject
            </Button>

            {activeTab === 'approved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkPoolMoveOpen(true)}
                disabled={bulkActing}
              >
                <UserMinusIcon className="size-4" />
                Remove from Job
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkTalentPool}
              disabled={bulkActing}
            >
              <StarIcon className="size-4" />
              Add to Talent Pool
            </Button>

            <Button size="sm" variant="outline" onClick={openBulkCompose}>
              <MailIcon className="size-4" />
              Email
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground"
              onClick={clearSelection}
            >
              <XIcon className="size-4" />
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="relative rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-10 bg-background/40 opacity-0 transition-opacity duration-150 dark:bg-background/60',
              openStageRowId && 'opacity-100'
            )}
          />
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-foreground/5 dark:bg-muted">
                {table.getHeaderGroups().map(hg => (
                  <TableRow
                    key={hg.id}
                    className="border-b hover:bg-transparent"
                  >
                    {hg.headers.map(h => (
                      <TableHead key={h.id} className="h-10 px-4">
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                              h.column.columnDef.header,
                              h.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading && data.length === 0 ? (
                  <TableSkeleton cols={columns.length} />
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer has-aria-expanded:bg-transparent',
                        openStageRowId === row.original._id &&
                          'relative z-20 bg-background/90'
                      )}
                      onClick={() => openDetail(row.original)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-2 py-2 shrink-0 bg-background">
            <TablePagination
              table={table}
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalRows={totalRows}
              label="candidates"
            />
          </div>
        </div>
      </div>

      {/* Bulk Move to Stage Dialog */}
      <Dialog open={bulkStageOpen} onOpenChange={setBulkStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to Stage</DialogTitle>
            <DialogDescription>
              Move {selectedCount} selected{' '}
              {selectedCount === 1 ? 'candidate' : 'candidates'} to a pipeline
              stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Stage</Label>
            <Select value={bulkStageId} onValueChange={setBulkStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a stage..." />
              </SelectTrigger>
              <SelectContent>
                {bulkStageOptions.map(s => (
                  <SelectItem key={s._id} value={s._id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkMoveStage}
              disabled={!bulkStageId || bulkActing}
            >
              {bulkActing ? 'Moving…' : 'Move Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject — same reason + destination dialog as the single flow */}
      <RejectDialog
        open={bulkRejectOpen}
        onOpenChange={setBulkRejectOpen}
        candidateName={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'}`}
        submitting={bulkActing}
        onConfirm={handleBulkReject}
      />

      {/* Bulk remove from job → Talent Pool */}
      <ConfirmDialog
        open={bulkPoolMoveOpen}
        onOpenChange={setBulkPoolMoveOpen}
        title="Remove from job and move to Talent Pool"
        description={`${selectedCount} selected ${selectedCount === 1 ? 'candidate' : 'candidates'} will be removed from ${jobIdFilter ? 'this job' : 'their current job'} and added to the Talent Pool. This is not a rejection. They can be assigned to another job later from the Talent Pool page.`}
        confirmLabel="Move to Talent Pool"
        loading={bulkActing}
        onConfirm={handleBulkMoveToTalentPool}
      />

      {/* Bulk email — one send, every selected address in the To list */}
      <ComposeEmailSheet
        open={bulkComposeOpen}
        onOpenChange={setBulkComposeOpen}
        mode={bulkComposeMode}
      />

      <CandidateDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />
    </>
  );
}
