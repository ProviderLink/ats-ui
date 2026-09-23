import { avatarBg } from '@/app/candidates/_utils/candidate-styles';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import { getJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Application, Candidate, Job } from '@/store';
import { useApplicationStore } from '@/store';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { BanIcon } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AppWithCandidate = { application: Application; candidate: Candidate };

// ── Module-level cache ─────────────────────────────────────────────────────
// Survives component unmounts (see job-candidates.tsx for the same pattern).

type CacheEntry = {
  applications: Application[];
  candidates: Candidate[];
  fetchedAt: number;
};
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

function buildStageMap(
  pairs: AppWithCandidate[],
  firstStageId?: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { application } of pairs) {
    result[application._id] =
      application.currentStage?.stageId || firstStageId || '';
  }
  return result;
}

function CardContent({
  candidate,
  onClick,
  onDelete,
}: {
  candidate: Candidate;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  const score = candidate.aiScore?.score ?? 0;
  const yearsExp =
    candidate.yearsOfExperience > 0
      ? `${candidate.yearsOfExperience} yrs exp`
      : '';
  const salaryUsd =
    candidate.currentSalaryUSD != null
      ? `$${(candidate.currentSalaryUSD / 1000).toFixed(candidate.currentSalaryUSD % 1000 === 0 ? 0 : 1)}K/mo`
      : '';
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative rounded-lg border bg-background p-3 w-full text-foreground',
        onClick && 'cursor-pointer hover:bg-muted/70 transition-colors'
      )}
    >
      {/* Header: score, name, email */}
      <div className="flex items-start gap-2">
        {score > 0 && (
          <span
            title={`AI fit score: ${score}/100`}
            className={cn(
              'inline-flex items-center justify-center size-8 rounded-tl-md text-[11px] font-bold tabular-nums shrink-0',
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
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground wrap-break-word mt-0.5">
            {candidate.email}
          </p>
        </div>
      </div>

      {/* Footer: experience, salary, reject */}
      {(yearsExp || salaryUsd || onDelete) && (
        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t">
          <span className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">
            {[yearsExp, salaryUsd].filter(Boolean).join(' · ')}
          </span>
          {onDelete && (
            <button
              type="button"
              title="Reject from this job"
              aria-label="Reject this candidate from the job"
              className="shrink-0 inline-flex items-center justify-center size-7 rounded-md border border-red-200 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/40 dark:hover:text-red-300 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              onClick={e => {
                e.stopPropagation();
                onDelete(e);
              }}
            >
              <BanIcon className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RejectedCard({
  candidate,
  onOpen,
}: {
  candidate: Candidate;
  onOpen: () => void;
}) {
  const score = candidate.aiScore?.score ?? 0;
  return (
    <div
      role="button"
      onClick={onOpen}
      className="rounded-lg border border-dashed bg-muted/50 p-3 w-full text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors opacity-60"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={cn(
            'size-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 select-none opacity-50',
            avatarBg(candidate.firstName)
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate line-through">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
            {candidate.email}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-dashed">
        <span className="text-[10px] font-medium text-destructive/70">
          Rejected
        </span>
        {score > 0 && (
          <span className="text-sm font-bold tabular-nums leading-none text-muted-foreground/50">
            {score}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  application,
  candidate,
  onOpen,
  onDelete,
}: AppWithCandidate & {
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { setNodeRef, attributes, listeners, isDragging, transform } =
    useDraggable({ id: application._id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-none', isDragging && 'opacity-40')}
    >
      <CardContent candidate={candidate} onClick={onOpen} onDelete={onDelete} />
    </div>
  );
}

function DroppableColumn({
  stageId,
  stageName,
  stageColor,
  pairs,
  onOpen,
  onDelete,
}: {
  stageId: string;
  stageName: string;
  stageColor: string;
  pairs: AppWithCandidate[];
  onOpen: (c: Candidate) => void;
  onDelete: (pair: AppWithCandidate, e: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div className="flex flex-col w-62.5 shrink-0 h-full">
      <div
        className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg border"
        style={{
          borderLeftWidth: 3,
          borderLeftColor: stageColor,
          backgroundColor: `${stageColor}12`,
          borderColor: `${stageColor}30`,
          borderLeftStyle: 'solid',
        }}
      >
        <span
          className="text-xs font-semibold tracking-wide truncate"
          style={{ color: stageColor }}
        >
          {stageName}
        </span>
        <span
          className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 min-w-5 text-center"
          style={{ backgroundColor: `${stageColor}25`, color: stageColor }}
        >
          {pairs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          backgroundImage: isOver
            ? undefined
            : 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
        className={cn(
          'flex-1 min-h-32 rounded-lg p-2 space-y-2 transition-colors border border-dashed text-border/60 overflow-y-auto',
          isOver
            ? 'border-primary/50 bg-primary/5'
            : 'border-border/50 bg-muted/10'
        )}
      >
        {pairs.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-20 text-[11px] text-muted-foreground/50 select-none">
            Drop here
          </div>
        ) : (
          pairs.map(pair => (
            <DraggableCard
              key={pair.application._id}
              {...pair}
              onOpen={() => onOpen(pair.candidate)}
              onDelete={e => onDelete(pair, e)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function JobPipelineBoard({ job }: { job: Job }) {
  const navigate = useNavigate();
  const moveStage = useApplicationStore(s => s.moveStage);
  const rejectApp = useApplicationStore(s => s.reject);

  // Direct API fetches to avoid race conditions with other components
  // that share the application/candidate stores.
  const cached = cache.get(job._id);
  const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  const [applications, setApplications] = useState<Application[]>(
    cacheFresh ? cached!.applications : []
  );
  const [candidates, setCandidates] = useState<Candidate[]>(
    cacheFresh ? cached!.candidates : []
  );

  useEffect(() => {
    const hadCache = cacheFresh;
    let alive = true;

    Promise.all([
      // All applications for every job, filtered locally. The board needs the
      // full set so it can tell whether a candidate still holds another live
      // application — rejecting them here must not silently affect that job.
      getJson<Application[] | { data: Application[] }>('/ats/applications', {
        limit: 9999,
      } as Record<string, unknown>),
      getJson<Candidate[] | { data: Candidate[] }>('/ats/candidates', {
        limit: 9999,
      }),
    ])
      .then(([appsRes, candsRes]) => {
        if (!alive) return;
        const apps = Array.isArray(appsRes) ? appsRes : (appsRes.data ?? []);
        const cands = Array.isArray(candsRes)
          ? candsRes
          : (candsRes.data ?? []);

        console.log(
          '[PipelineBoard] apps=%d cands=%d jobId=%s pipeline=%s',
          apps.length,
          cands.length,
          job._id,
          job.pipeline ? `${job.pipeline.stages.length} stages` : 'none'
        );
        const approved = apps.filter(
          a => a.jobId === job._id && a.phase === 'approved'
        );
        console.log('[PipelineBoard] approved apps:', approved.length);
        if (approved.length > 0) {
          console.log(
            '[PipelineBoard] sample approved app:',
            JSON.stringify({
              _id: approved[0]._id,
              candidateId: approved[0].candidateId,
              phase: approved[0].phase,
              currentStage: approved[0].currentStage,
            })
          );
          // Check join
          const candIds = new Set(cands.map(c => c._id));
          const joinable = approved.filter(a => candIds.has(a.candidateId));
          console.log(
            '[PipelineBoard] joinable: %d/%d',
            joinable.length,
            approved.length
          );
          if (joinable.length === 0) {
            console.warn(
              '[PipelineBoard] candidateId mismatch! app candidateIds sample:',
              approved.slice(0, 3).map(a => a.candidateId),
              'cand _ids sample:',
              cands.slice(0, 3).map(c => c._id)
            );
          }
        }

        cache.set(job._id, {
          applications: apps,
          candidates: cands,
          fetchedAt: Date.now(),
        });

        setApplications(apps);
        setCandidates(cands);
      })
      .catch((err: unknown) => {
        if (!alive || hadCache) return;
        console.error('[PipelineBoard] fetch FAILED:', err);
      });

    return () => {
      alive = false;
    };
  }, [job._id]);

  const jobApplications = applications.filter(
    // Approved-phase applications are actively moving through stages.
    // Rejected applications are shown in a static column for historical reference.
    a =>
      a.jobId === job._id && (a.phase === 'approved' || a.phase === 'rejected')
  );

  const approvedApplications = jobApplications.filter(
    a => a.phase === 'approved'
  );
  const rejectedApplications = jobApplications.filter(
    a => a.phase === 'rejected'
  );

  const pairs: AppWithCandidate[] = useMemo(
    () =>
      approvedApplications
        .map(application => {
          const candidate = candidates.find(
            c => c._id === application.candidateId
          );
          return candidate ? { application, candidate } : null;
        })
        .filter((x): x is AppWithCandidate => x !== null),
    [approvedApplications, candidates]
  );

  const rejectedPairs: AppWithCandidate[] = useMemo(
    () =>
      rejectedApplications
        .map(application => {
          const candidate = candidates.find(
            c => c._id === application.candidateId
          );
          return candidate ? { application, candidate } : null;
        })
        .filter((x): x is AppWithCandidate => x !== null),
    [rejectedApplications, candidates]
  );

  const stages = [...(job.pipeline?.stages ?? [])]
    .filter(s => s.isActive)
    .sort((a, b) => a.order - b.order);

  // If an approved application has no currentStage (common after migration
  // or direct-apply approvals), default it to the first pipeline stage so
  // the card actually appears in a column rather than being invisible.
  const firstStageId = stages[0]?._id;

  const [stageMap, setStageMap] = useState<Record<string, string>>(() =>
    buildStageMap(pairs, firstStageId)
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AppWithCandidate | null>(
    null
  );
  const [rejecting, setRejecting] = useState(false);

  /**
   * Live applications the reject target holds on OTHER jobs. When non-zero the
   * dialog hides the destination options, because banning or pooling them would
   * silently destroy that other job's pipeline.
   */
  const otherLiveApplicationCount = useMemo(() => {
    if (!rejectTarget) return 0;
    return applications.filter(
      a =>
        a.candidateId === rejectTarget.candidate._id &&
        a._id !== rejectTarget.application._id &&
        (a.phase === 'pending' || a.phase === 'approved')
    ).length;
  }, [applications, rejectTarget]);

  /**
   * Reject the card's application. A board card belongs to this job, so the
   * candidate may still hold other live applications — the dialog hides the
   * destination options in that case and only removes them from this job.
   *
   * The card automatically moves to the Rejected column because that column is
   * derived from `phase === 'rejected'` on the local applications list, and the
   * reject store action patches the item in place.
   */
  async function handleReject(payload: RejectPayload) {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await rejectApp(rejectTarget.application._id, payload);
      const name = `${rejectTarget.candidate.firstName} ${rejectTarget.candidate.lastName}`;
      toast.success(
        `${name} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRejecting(false);
    }
  }

  // Re-sync the local stage map when the underlying data changes
  // (server-side stage moves, job switch, approving a new candidate, etc).
  // The signature covers both the application stage assignments AND the
  // candidate join state — otherwise applications arriving before candidates
  // would snapshot an empty map and never recover.
  const stageSignature = useMemo(
    () =>
      `${approvedApplications
        .map(a => `${a._id}:${a.currentStage?.stageId ?? ''}:${a.phase}`)
        .join('|')}|cands:${candidates.length}`,
    [approvedApplications, candidates.length]
  );
  useEffect(() => {
    setStageMap(buildStageMap(pairs, firstStageId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSignature]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeItem = pairs.find(p => p.application._id === activeId);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ over }: DragEndEvent) {
    if (over && activeId) {
      const newStageId = over.id as string;
      setStageMap(prev => ({ ...prev, [activeId]: newStageId }));
      await moveStage(activeId, newStageId);
    }
    setActiveId(null);
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
        <p className="text-sm">No pipeline stages configured</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto py-4">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={e => void handleDragEnd(e)}
      >
        <div className="flex gap-3 h-full pb-2 pl-4">
          {stages.map(stage => {
            const stagePairs = pairs.filter(
              p => (stageMap[p.application._id] ?? '') === stage._id
            );
            return (
              <DroppableColumn
                key={stage._id}
                stageId={stage._id}
                stageName={stage.name}
                stageColor={stage.color}
                pairs={stagePairs}
                onOpen={c => navigate(`/ats/candidates/${c._id}`)}
                onDelete={(pair, e) => {
                  e.stopPropagation();
                  setRejectTarget(pair);
                }}
              />
            );
          })}
          {/* Rejected column — static, no drag */}
          {rejectedPairs.length > 0 && (
            <div className="flex flex-col w-62.5 shrink-0 h-full">
              <div
                className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg border border-destructive/20 bg-destructive/5"
                style={{
                  // NOTE: `--destructive` is a COMPLETE colour (an oklch() value),
                  // not an HSL/`r g b` triplet, so it must never be wrapped in
                  // `hsl(var(--destructive))` — that is unparseable and the
                  // browser silently drops the declaration. The left accent keeps
                  // an inline override because it needs to beat the
                  // `border-destructive/20` class; inline styles win over classes,
                  // so there is no utility-ordering ambiguity here.
                  borderLeftWidth: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: 'var(--destructive)',
                }}
              >
                <span className="text-xs font-semibold tracking-wide truncate text-destructive/70">
                  Rejected
                </span>
                <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full shrink-0 min-w-5 text-center bg-destructive/10 text-destructive/70">
                  {rejectedPairs.length}
                </span>
              </div>
              <div className="flex-1 min-h-32 rounded-lg p-2 space-y-2 border border-dashed border-destructive/20 bg-destructive/2 overflow-y-auto">
                {rejectedPairs.map(pair => (
                  <RejectedCard
                    key={pair.application._id}
                    candidate={pair.candidate}
                    onOpen={() =>
                      navigate(`/ats/candidates/${pair.candidate._id}`)
                    }
                  />
                ))}
              </div>
            </div>
          )}
          <div className="w-4 shrink-0" />
        </div>
        <DragOverlay dropAnimation={null}>
          {activeItem && (
            <div className="w-62.5 shadow-xl rotate-1 opacity-95">
              <CardContent candidate={activeItem.candidate} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={open => {
          if (!open) setRejectTarget(null);
        }}
        candidateName={
          rejectTarget
            ? `${rejectTarget.candidate.firstName} ${rejectTarget.candidate.lastName}`
            : undefined
        }
        jobTitle={job.title}
        currentStageName={rejectTarget?.application.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={rejecting}
        onConfirm={handleReject}
      />
    </div>
  );
}
