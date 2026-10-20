import { RejectDialog } from '@/components/reject-dialog';
import type { Job } from '@/store';
import { DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { useBoardReject } from '../_hooks/use-board-reject';
import { isIneligibleRejection } from '../_utils/job-candidates';
import { usePipelineBoardData } from '../_hooks/use-pipeline-board-data';
import { usePipelineBoardDnd } from '../_hooks/use-pipeline-board-dnd';
import {
  candidateFullName,
  pairWithCandidates,
} from '../_utils/pipeline-board';
import { CandidateCard } from './job-pipeline-board/candidate-card';
import { DroppableColumn } from './job-pipeline-board/droppable-column';
import { RejectedColumn } from './job-pipeline-board/rejected-column';

interface JobPipelineBoardProps {
  job: Job;
}

export function JobPipelineBoard({ job }: JobPipelineBoardProps) {
  const navigate = useNavigate();
  const { applications, candidates, loading } = usePipelineBoardData(job._id);

  const jobApplications = applications.filter(
    a => a.jobId === job._id && !isIneligibleRejection(a)
  );
  const pairs = pairWithCandidates(
    jobApplications.filter(a => a.phase === 'approved'),
    candidates
  );
  const rejectedPairs = pairWithCandidates(
    jobApplications.filter(a => a.phase === 'rejected'),
    candidates
  );

  const stages = [...(job.pipeline?.stages ?? [])]
    .filter(s => s.isActive)
    .sort((a, b) => a.order - b.order);

  // Approved applications with no currentStage (common after migration or
  // direct-apply approvals) default to the first stage so they stay visible.
  const dnd = usePipelineBoardDnd(pairs, stages[0]?._id);
  const rejectFlow = useBoardReject(applications);

  const openCandidate = (id: string) => navigate(`/ats/candidates/${id}`);

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
        sensors={dnd.sensors}
        collisionDetection={rectIntersection}
        onDragStart={dnd.onDragStart}
        onDragEnd={e => void dnd.onDragEnd(e)}
      >
        <div className="flex gap-3 h-full pb-2 pl-4">
          {stages.map(stage => (
            <DroppableColumn
              key={stage._id}
              stageId={stage._id}
              stageName={stage.name}
              stageColor={stage.color}
              loading={loading}
              pairs={pairs.filter(
                p => (dnd.stageMap[p.application._id] ?? '') === stage._id
              )}
              onOpen={c => openCandidate(c._id)}
              onDelete={(pair, e) => {
                e.stopPropagation();
                rejectFlow.setTarget(pair);
              }}
            />
          ))}
          {rejectedPairs.length > 0 && (
            <RejectedColumn
              pairs={rejectedPairs}
              onOpen={c => openCandidate(c._id)}
            />
          )}
          <div className="w-4 shrink-0" />
        </div>
        <DragOverlay dropAnimation={null}>
          {dnd.activeItem && (
            <div className="w-62.5 shadow-xl rotate-1 opacity-95">
              <CandidateCard candidate={dnd.activeItem.candidate} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <RejectDialog
        open={!!rejectFlow.target}
        onOpenChange={open => {
          if (!open) rejectFlow.setTarget(null);
        }}
        candidateName={
          rejectFlow.target
            ? candidateFullName(rejectFlow.target.candidate)
            : undefined
        }
        jobTitle={job.title}
        currentStageName={
          rejectFlow.target?.application.currentStage?.stageName
        }
        hasOtherLiveApplication={rejectFlow.otherLiveApplicationCount > 0}
        submitting={rejectFlow.rejecting}
        onConfirm={rejectFlow.reject}
      />
    </div>
  );
}
