import {
  avatarBg,
  scoreTextColor,
  statusConfig,
} from '@/app/candidates/_utils/candidate-styles';
import { DispositionDialog } from '@/components/disposition-dialog';
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
import { Trash2Icon } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const { label: statusLabel, cls: statusCls } = statusConfig[candidate.status];
  const score = candidate.aiScore?.score ?? 0;
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative rounded-lg border bg-background p-3 w-full text-foreground',
        onClick && 'cursor-pointer hover:bg-muted/70 transition-colors'
      )}
    >
      {onDelete && (
        <button
          type="button"
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
          onClick={e => {
            e.stopPropagation();
            onDelete(e);
          }}
          tabIndex={-1}
        >
          <Trash2Icon className="size-3 text-destructive/70" />
        </button>
      )}
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={cn(
            'size-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 select-none',
            avatarBg(candidate.firstName)
          )}
        >
          {candidate.firstName[0]}
          {candidate.lastName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
            {candidate.email}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 pt-2 border-t">
        <span className={cn('text-[10px] font-medium', statusCls)}>
          {statusLabel}
        </span>
        {score > 0 && (
          <span
            className={cn(
              'text-sm font-bold tabular-nums leading-none',
              scoreTextColor(score)
            )}
          >
            {score}
          </span>
        )}
      </div>
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
    <div className="flex flex-col w-52 shrink-0 h-full">
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
      getJson<Application[] | { data: Application[] }>('/ats/applications', {
        jobId: job._id,
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
  const [disposeTarget, setDisposeTarget] = useState<AppWithCandidate | null>(
    null
  );

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
                  setDisposeTarget(pair);
                }}
              />
            );
          })}
          {/* Rejected column — static, no drag */}
          {rejectedPairs.length > 0 && (
            <div className="flex flex-col w-52 shrink-0 h-full">
              <div
                className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg border"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: 'hsl(var(--destructive))',
                  backgroundColor: 'hsl(var(--destructive) / 0.05)',
                  borderColor: 'hsl(var(--destructive) / 0.2)',
                  borderLeftStyle: 'solid',
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
            <div className="w-52 shadow-xl rotate-1 opacity-95">
              <CardContent candidate={activeItem.candidate} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <DispositionDialog
        open={!!disposeTarget}
        onOpenChange={open => {
          if (!open) setDisposeTarget(null);
        }}
        applicationId={disposeTarget?.application._id ?? ''}
        currentStageName={disposeTarget?.application.currentStage?.stageName}
      />
    </div>
  );
}
