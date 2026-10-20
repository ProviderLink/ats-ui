import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store';
import { useDroppable } from '@dnd-kit/core';
import type React from 'react';
import type { AppWithCandidate } from '../../_utils/pipeline-board';
import { DraggableCard } from './draggable-card';

interface DroppableColumnProps {
  stageId: string;
  stageName: string;
  stageColor: string;
  pairs: AppWithCandidate[];
  loading?: boolean;
  onOpen: (c: Candidate) => void;
  onDelete: (pair: AppWithCandidate, e: React.MouseEvent) => void;
}

export function DroppableColumn({
  stageId,
  stageName,
  stageColor,
  pairs,
  loading = false,
  onOpen,
  onDelete,
}: DroppableColumnProps) {
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
          {loading ? <Skeleton className="h-3 w-3 rounded-full" /> : pairs.length}
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
        {loading && pairs.length === 0 ? (
          <div
            className="space-y-2"
            role="status"
            aria-label="Loading candidates"
          >
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : pairs.length === 0 ? (
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
