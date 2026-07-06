import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { TablePagination } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useSocketRoom } from '@/hooks/use-socket-room';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useAuthStore } from '@/store/slices/auth.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type {
  Application,
  Candidate,
  CandidateStatus,
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
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  UserCheckIcon,
  XIcon,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { avatarBg, getFitConfig } from '../_utils/candidate-styles';
import { CandidateDetailSheet } from './candidate-detail-sheet';

const HEADER_CLS =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';
const SORT_BTN_CLS =
  '-ml-2 h-7 gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground';

export function ColHeader({ children }: { children: React.ReactNode }) {
  return <span className={HEADER_CLS}>{children}</span>;
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
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {candidate.email}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {candidate.yearsOfExperience} yrs of exp
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

function CurrentStageCell({
  stageName,
  color,
  assignedAt,
}: {
  stageName: string;
  color: string;
  assignedAt?: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="size-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <span className="text-sm font-medium truncate block">{stageName}</span>
        {assignedAt && (
          <span className="text-xs text-muted-foreground">
            {timeAgo(assignedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function DeleteConfirmDialog({
  candidate,
  open,
  onClose,
  onConfirm,
}: {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!candidate) return null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Candidate</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-medium">
              {candidate.firstName} {candidate.lastName}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewActionsDropdown({
  candidate,
  onMutated,
}: {
  candidate: Candidate;
  onMutated?: () => void;
}) {
  const candStore = useCandidateStore();
  const appStore = useApplicationStore();
  const allApps = useApplicationStore(s => s.items);
  const [approveOpen, setApproveOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const name = `${candidate.firstName} ${candidate.lastName}`;
  const hasJobApplied = !!candidate.appliedJobId;

  async function handleApprove() {
    setActing(true);
    try {
      await candStore.approve(candidate._id, candidate.appliedJobId || '');
      toast.success(`${name} approved`);
      setApproveOpen(false);
      await candStore.fetch();
      await appStore.fetch({ limit: 9999 });
      onMutated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    const candidateApps = allApps.filter(
      a => a.candidateId === candidate._id && a.phase !== 'rejected'
    );
    const warnMsg =
      candidateApps.length > 0
        ? `${name} has ${candidateApps.length} active application(s). Deleting the candidate will also remove all associated data. Are you sure you want to permanently delete ${name}?`
        : `Permanently delete ${name}? This cannot be undone.`;
    if (!confirm(warnMsg)) return;

    setActing(true);
    try {
      await candStore.reject(candidate._id);
      toast.success(`${name} rejected and removed`);
      await candStore.fetch();
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
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Approve
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setApproveOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-green-100 dark:bg-green-900/30 shrink-0">
              <CheckIcon className="size-3.5 text-green-600 dark:text-green-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Approve</span>
              <span className="text-[11px] text-muted-foreground">
                Create application for applied job
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
            Reject
          </div>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={handleReject}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                Permanently delete candidate
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
              <StarIcon className="size-3.5 text-amber-500" />
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

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve {name}</DialogTitle>
            <DialogDescription>
              {hasJobApplied
                ? 'This will approve the candidate and create an application for the job they applied to. AI scoring will run automatically.'
                : 'This candidate did not apply through a job posting. Use quick-import to assign them to a job first.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            {hasJobApplied && (
              <Button onClick={handleApprove} disabled={acting}>
                {acting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <CheckIcon className="size-4" />
                )}
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HiredActionsDropdown({ candidate }: { candidate: Candidate }) {
  const candStore = useCandidateStore();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const name = `${candidate.firstName} ${candidate.lastName}`;

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

  async function handleDelete() {
    setActing(true);
    try {
      await candStore.remove(candidate._id);
      toast.success(`${name} deleted`);
      setDeleteOpen(false);
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
            className="hover:bg-silver-200 dark:hover:bg-white/10 data-[state=open]:bg-silver-200 dark:data-[state=open]:bg-white/10"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1.5">
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => navigate('/ats/emails')}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <MailIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Email</span>
              <span className="text-[11px] text-muted-foreground">
                Send a manual email
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setTalentPoolConfirmOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <StarIcon className="size-3.5 text-amber-500" />
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
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <Trash2Icon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Delete</span>
              <span className="text-[11px] text-muted-foreground">
                Permanently remove
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Candidate</DialogTitle>
            <DialogDescription>
              Permanently delete <span className="font-medium">{name}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={acting}
            >
              {acting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [appDeleteOpen, setAppDeleteOpen] = useState(false);
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [acting, setActing] = useState(false);

  const openJobs = useMemo(
    () => allJobs.filter(j => j.status === 'open'),
    [allJobs]
  );
  const stageSelectRef = useRef<HTMLButtonElement>(null);
  const rejectRef = useRef<HTMLTextAreaElement>(null);

  const name = `${candidate.firstName} ${candidate.lastName}`;

  // Delete restriction: candidate is protected if active in any pipeline, hired, or in talent pool
  const hasActivePipeline = allCandidateApps.some(a => a.phase === 'approved');
  const hasHired = allCandidateApps.some(a => a.phase === 'hired');
  const isDeletable =
    !hasActivePipeline && !hasHired && !candidate.inTalentPool;

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

  async function handleReject() {
    if (!application) return;

    setActing(true);
    try {
      const result = await appStore.reject(
        application._id,
        rejectReason || undefined
      );
      if (result.candidateDeleted) {
        toast.success(
          `${name} rejected from ${job?.title ?? 'this job'} and removed from system`
        );
      } else {
        toast.success(`${name} rejected from ${job?.title ?? 'this job'}`);
      }
      setRejectOpen(false);
      setRejectReason('');
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

  async function handleReassign() {
    if (!selectedJobId) return;
    setActing(true);
    try {
      await candStore.assignJob(candidate._id, selectedJobId);
      toast.success(`${name} added to another job`);
      setReassignOpen(false);
      setSelectedJobId('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    setActing(true);
    try {
      await candStore.remove(candidate._id);
      toast.success(`${name} deleted`);
      setDeleteOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  }

  async function handleDeleteApp() {
    if (!application) return;
    setActing(true);
    try {
      await appStore.remove(application._id);
      toast.success(`Application removed`);
      setAppDeleteOpen(false);
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
            disabled={!application}
            onClick={() => {
              setRejectReason('');
              setRejectOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <BanIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Reject</span>
              <span className="text-[11px] text-muted-foreground">
                Rejected from this job only
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
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            onClick={() => setTalentPoolConfirmOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
              <StarIcon className="size-3.5 text-amber-500" />
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
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
            disabled={openJobs.length === 0}
            onClick={() => {
              setSelectedJobId('');
              setReassignOpen(true);
            }}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-teal-100 dark:bg-teal-900/30 shrink-0">
              <ArrowRightLeftIcon className="size-3.5 text-teal-600 dark:text-teal-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Add to Another Job</span>
              <span className="text-[11px] text-muted-foreground">
                Also assign to another open position
              </span>
            </span>
          </DropdownMenuItem>
          <div className="mx-2 my-2 h-px bg-border" />
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            disabled={!application}
            onClick={() => setAppDeleteOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <XIcon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Delete Application</span>
              <span className="text-[11px] text-muted-foreground">
                Remove from this job only
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <span className="flex items-center justify-center size-7 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
              <Trash2Icon className="size-3.5 text-red-600 dark:text-red-400" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm">Delete Candidate</span>
              <span className="text-[11px] text-muted-foreground">
                Permanently remove
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
              disabled={!selectedStageId || acting}
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

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject from this Job</DialogTitle>
            <DialogDescription>
              {(() => {
                const hasOtherActive = allApps.some(
                  a =>
                    a.candidateId === candidate._id &&
                    a._id !== application?._id &&
                    (a.phase === 'pending' || a.phase === 'approved')
                );
                const willCascade =
                  !hasOtherActive &&
                  !candidate.inTalentPool &&
                  candidate.status !== 'hired';
                if (willCascade) {
                  return (
                    <>
                      Rejecting <span className="font-medium">{name}</span> from{' '}
                      <span className="font-medium">
                        {job?.title ?? 'this job'}
                      </span>{' '}
                      will also{' '}
                      <span className="font-semibold text-destructive">
                        permanently delete
                      </span>{' '}
                      the candidate and all associated data — they have no other
                      active applications, are not in the talent pool, and are
                      not hired.
                    </>
                  );
                }
                return (
                  <>
                    Reject <span className="font-medium">{name}</span> for{' '}
                    <span className="font-medium">
                      {job?.title ?? 'this job'}
                    </span>
                    . The candidate will remain in the system.
                  </>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <textarea
              ref={rejectRef}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g. Not enough experience..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={acting}
            >
              {acting ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Another Job</DialogTitle>
            <DialogDescription>
              Also assign <span className="font-medium">{name}</span> to another
              open position. This does not remove them from{' '}
              <span className="font-medium">{job?.title ?? 'current job'}</span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Job</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job..." />
              </SelectTrigger>
              <SelectContent>
                {openJobs
                  .filter(j => j._id !== job?._id)
                  .map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!selectedJobId || acting}
            >
              {acting ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete Application Dialog */}
      <Dialog open={appDeleteOpen} onOpenChange={setAppDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Application?</DialogTitle>
            <DialogDescription>
              This will permanently remove{' '}
              <span className="font-medium">{name}</span>'s application from{' '}
              <span className="font-medium">{job?.title ?? 'this job'}</span>.
              The candidate record will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteApp}
              disabled={acting}
            >
              {acting ? 'Removing…' : 'Delete Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog — normal (no active dependencies) */}
      {isDeletable ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Candidate</DialogTitle>
              <DialogDescription>
                Permanently delete <span className="font-medium">{name}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={acting}
              >
                {acting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        /* Delete Dialog — super prompt for protected candidates */
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">
                Force Delete Candidate
              </DialogTitle>
              <DialogDescription className="flex flex-col gap-3 pt-2">
                <p>
                  <span className="font-medium text-foreground">{name}</span>{' '}
                  cannot be safely deleted because they have:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  {hasActivePipeline && (
                    <li>Active applications in pipeline</li>
                  )}
                  {hasHired && <li>Hired for one or more jobs</li>}
                  {candidate.inTalentPool && <li>Currently in Talent Pool</li>}
                </ul>
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs font-medium">
                  ⚠ This will permanently delete the candidate and ALL
                  associated data — applications, interviews, emails, and
                  history — across every job. This action cannot be undone.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={acting}
              >
                {acting ? 'Deleting…' : 'Delete Everywhere'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

type TabValue = CandidateStatus;

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
  const fetchCandidates = useCandidateStore(s => s.fetch);
  const remove = useCandidateStore(s => s.remove);

  const allApps = useApplicationStore(s => s.items);

  const allJobs = useJobStore(s => s.items);
  const allClients = useClientStore(s => s.items);

  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
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
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);

  // Subscribe to real-time candidate and application updates
  useSocketRoom('candidates');
  useSocketRoom('applications');

  const VALID_SIZES = [10, 15, 20, 30, 50];
  const [pageIndex, setPageIndex] = useState(() => {
    const raw = parseInt(
      sessionStorage.getItem('candidates-page-index') ?? '',
      10
    );
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  });
  const [pageSize, setPageSize] = useState(() => {
    const raw = parseInt(
      localStorage.getItem('candidates-page-size') ?? '',
      10
    );
    return VALID_SIZES.includes(raw) ? raw : 20;
  });

  // Debounced search ref
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // After boot, all candidates are already in the store. No fetch needed —
  // we filter client-side by activeTab instead of making server calls.

  // ── Derived maps from shared app/job/client stores ───────────────

  // candidateId → { jobTitle, clientName }[] for the Job column.
  const jobInfosByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const clientNameById = new Map(allClients.map(c => [c._id, c.companyName]));
    const map = new Map<string, { jobTitle: string; clientName: string }[]>();
    for (const a of allApps) {
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
      { stageName: string; stageColor: string; assignedAt: string }
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
        assignedAt: a.currentStage.assignedAt,
      });
    }
    return map;
  }, [allApps, allJobs]);

  // candidateId → { jobTitle, clientName, hiredAt, hiredBy } for Hired tab.
  const hireInfoByCandidateId = useMemo(() => {
    const jobById = new Map(allJobs.map(j => [j._id, j]));
    const clientNameById = new Map(allClients.map(c => [c._id, c.companyName]));
    const map = new Map<
      string,
      {
        jobTitle: string;
        clientName: string;
        hiredAt: string;
        hiredBy?: string;
      }[]
    >();
    for (const a of allApps) {
      if (a.phase !== 'hired') continue;
      const job = jobById.get(a.jobId);
      const infos = map.get(a.candidateId) ?? [];
      infos.push({
        jobTitle: job?.title ?? a.jobId,
        clientName: job
          ? (clientNameById.get(job.clientId) ?? job.clientId)
          : '',
        hiredAt: a.hiredAt ?? a.createdAt,
        hiredBy: a.hiredBy ?? undefined,
      });
      map.set(a.candidateId, infos);
    }
    return map;
  }, [allApps, allJobs, allClients]);

  // candidateId → counts for other activity on hired candidates
  const otherActivityByCandidateId = useMemo(() => {
    const map = new Map<
      string,
      { inPipeline: number; inTalentPool: boolean }
    >();
    for (const a of allApps) {
      if (a.phase === 'approved') {
        const e = map.get(a.candidateId) ?? {
          inPipeline: 0,
          inTalentPool: false,
        };
        e.inPipeline++;
        map.set(a.candidateId, e);
      }
    }
    // Also set talent pool from candidate data
    for (const c of items) {
      const e = map.get(c._id);
      if (e) e.inTalentPool = c.inTalentPool;
    }
    return map;
  }, [allApps, items]);

  // ── Helpers ──────────────────────────────────────────────────────

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab);
    setPageIndex(0);
    sessionStorage.setItem('candidates-page-index', '0');
    setSorting([
      { id: tab === 'hired' ? 'hiredDate' : 'createdAt', desc: true },
    ]);
    const defaultSort: CandidateSortOption = 'newest';
    setSortBy(defaultSort);
    localStorage.setItem('candidates-sort-by', defaultSort);
  }

  function handleSortChange(opt: CandidateSortOption) {
    setSortBy(opt);
    localStorage.setItem('candidates-sort-by', opt);
    setPageIndex(0);
    sessionStorage.setItem('candidates-page-index', '0');
  }

  function handleSearchChange(q: string) {
    // Update input immediately for responsive typing
    setInputValue(q);
    // Debounce the actual search query to avoid hammering the server
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setPageIndex(0);
    sessionStorage.setItem('candidates-page-index', '0');
    searchTimer.current = setTimeout(() => {
      setQuery(q);
    }, 300);
  }

  function handleClearSearch() {
    setInputValue('');
    setQuery('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }

  function handlePaginationChange(
    updater:
      | { pageIndex: number; pageSize: number }
      | ((prev: { pageIndex: number; pageSize: number }) => {
          pageIndex: number;
          pageSize: number;
        })
  ) {
    const next =
      typeof updater === 'function'
        ? updater({ pageIndex, pageSize })
        : updater;
    const safeIndex =
      Number.isFinite(next.pageIndex) && next.pageIndex >= 0
        ? next.pageIndex
        : 0;
    const safeSize = VALID_SIZES.includes(next.pageSize) ? next.pageSize : 20;
    setPageIndex(safeIndex);
    setPageSize(safeSize);
    sessionStorage.setItem('candidates-page-index', String(safeIndex));
    localStorage.setItem('candidates-page-size', String(safeSize));
  }

  async function handleDelete(candidate: Candidate) {
    try {
      await remove(candidate._id);
      if (data.length === 1 && pageIndex > 0) {
        const newIdx = pageIndex - 1;
        setPageIndex(newIdx);
        sessionStorage.setItem('candidates-page-index', String(newIdx));
      }
      const refetchPage =
        data.length === 1 && pageIndex > 0 ? pageIndex : pageIndex + 1;
      await fetchCandidates({
        status: activeTab,
        page: refetchPage,
        limit: 9999,
      });
      toast.success(`${candidate.firstName} ${candidate.lastName} deleted`);
    } catch (e) {
      toast.error((e as Error).message);
    }
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
      pending: base.filter(c => c.status === 'pending').length,
      approved: base.filter(c => effectivePipelineIds.has(c._id)).length,
      hired: base.filter(c => c.status === 'hired').length,
    };
  }, [items, jobIdFilter, allApps, effectivePipelineIds]);

  // ── Client-side filtering by tab + search ────────────────────────
  // After boot, ALL candidates are in the store. We filter by activeTab
  // and search query locally — no server round-trip needed.
  const filteredData = useMemo(() => {
    // First filter by active tab
    let result = items.filter(c => {
      if (activeTab === 'approved') {
        return effectivePipelineIds.has(c._id);
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
  }, [items, query, activeTab, jobIdFilter, allApps, effectivePipelineIds]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
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

  const columns = useMemo<ColumnDef<Candidate>[]>(() => {
    const isPipeline = activeTab === 'approved';
    const isHired = activeTab === 'hired';

    const stageCol: ColumnDef<Candidate> = {
      id: 'currentStage',
      header: () => <ColHeader>Current Stage</ColHeader>,
      cell: ({ row }) => {
        const info = stageInfoByCandidateId.get(row.original._id);
        if (!info)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <CurrentStageCell
            stageName={info.stageName}
            color={info.stageColor}
            assignedAt={info.assignedAt}
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

    const otherActivityCol: ColumnDef<Candidate> = {
      id: 'otherActivity',
      header: () => <ColHeader>Other Activity</ColHeader>,
      cell: ({ row }) => {
        const info = otherActivityByCandidateId.get(row.original._id);
        if (!info || (info.inPipeline === 0 && !info.inTalentPool)) {
          return <span className="text-xs text-muted-foreground/60">—</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {info.inPipeline > 0 && (
              <span className="inline-flex items-center gap-1 h-6 rounded-md border border-pine-teal-300 bg-pine-teal-100 px-2 text-xs font-medium text-pine-teal-700 dark:border-pine-teal-800/50 dark:bg-pine-teal-950/30 dark:text-pine-teal-300">
                <GitCommitHorizontalIcon className="size-3 shrink-0" />
                {info.inPipeline} in pipeline
              </span>
            )}
            {info.inTalentPool && row.original.inTalentPool && (
              <span className="inline-flex items-center gap-1 h-6 rounded-md border border-violet-300 bg-violet-100 px-2 text-xs font-medium text-violet-700 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-300">
                <StarIcon className="size-3 shrink-0 fill-violet-400 text-violet-500 dark:fill-violet-500 dark:text-violet-400" />
                Talent pool
              </span>
            )}
          </div>
        );
      },
    };

    return [
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
        header: () => (
          <ColHeader>{isHired ? 'Hired For' : 'Job Applied'}</ColHeader>
        ),
        cell: ({ row }) => {
          if (isHired) {
            const infos = hireInfoByCandidateId.get(row.original._id);
            if (!infos || infos.length === 0)
              return <span className="text-xs text-muted-foreground">—</span>;
            const first = infos[0];
            const rest = infos.slice(1);
            return (
              <div className="flex items-start gap-1.5 min-w-35 max-w-55 rounded-sm border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 px-2 py-1 -my-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium whitespace-normal leading-tight">
                    {first.jobTitle}
                  </p>
                  {first.clientName && (
                    <p className="text-[11px] text-muted-foreground whitespace-normal leading-tight mt-0.5">
                      {first.clientName}
                    </p>
                  )}
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatDate(first.hiredAt)}
                  </p>
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
          // Try app-based lookup first (approved/hired candidates have applications)
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
      ...(isHired ? [otherActivityCol] : isPipeline ? [stageCol] : [roleCol]),
      {
        id: 'skills',
        accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
        header: () => <ColHeader>Skills</ColHeader>,
        cell: ({ row }) => <SkillsCell candidate={row.original} />,
      },
      ...(isHired
        ? []
        : ([
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
            } satisfies ColumnDef<Candidate>,
          ] as ColumnDef<Candidate>[])),
      {
        id: isHired ? 'hiredDate' : 'createdAt',
        accessorKey: isHired ? undefined : 'createdAt',
        accessorFn: isHired
          ? row => {
              const infos = hireInfoByCandidateId.get(row._id);
              return infos?.[0]?.hiredAt ?? row.createdAt;
            }
          : undefined,
        header: isHired
          ? ({ column }) => (
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => column.toggleSorting()}
              >
                Hired Date <ArrowUpDownIcon className="size-3" />
              </Button>
            )
          : ({ column }) => (
              <Button
                variant="ghost"
                size="sm"
                className={SORT_BTN_CLS}
                onClick={() => column.toggleSorting()}
              >
                Applied <ArrowUpDownIcon className="size-3" />
              </Button>
            ),
        cell: ({ row }) => {
          if (isHired) {
            const infos = hireInfoByCandidateId.get(row.original._id);
            const date = infos?.[0]?.hiredAt ?? row.original.createdAt;
            return (
              <span className="text-xs text-muted-foreground">
                {formatDate(date)}
              </span>
            );
          }
          return (
            <span className="text-xs text-muted-foreground">
              {formatDate(row.original.createdAt)}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex justify-center">
            <EllipsisIcon className="size-3.5 text-muted-foreground" />
          </div>
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            {isHired ? (
              <HiredActionsDropdown candidate={row.original} />
            ) : isPipeline ? (
              <PipelineActionsMenu
                candidate={row.original}
                allApps={allApps}
                allJobs={allJobs}
              />
            ) : (
              <ReviewActionsDropdown candidate={row.original} />
            )}
          </div>
        ),
      },
    ];
  }, [
    activeTab,
    jobInfosByCandidateId,
    stageInfoByCandidateId,
    hireInfoByCandidateId,
    otherActivityByCandidateId,
    allApps,
    allJobs,
    allClients,
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
                {
                  value: 'hired' as const,
                  label: 'Hired',
                  count: counts.hired,
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
                {CANDIDATE_SORT_OPTIONS.filter(opt =>
                  activeTab === 'hired'
                    ? !['highest_score', 'lowest_score'].includes(opt)
                    : true
                ).map(opt => (
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

        {/* Table */}
        <div className="rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden">
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
                      className="border-b last:border-0 hover:bg-foreground/4 dark:hover:bg-white/3 cursor-pointer"
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

      <CandidateDetailSheet
        candidate={selected}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelected(null);
        }}
        mutating={mutating}
      />

      <DeleteConfirmDialog
        candidate={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget!)}
      />
    </>
  );
}
