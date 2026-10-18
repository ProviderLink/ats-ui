import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';
import type React from 'react';
import type { AppWithCandidate } from '../../_utils/pipeline-board';
import { CandidateCard } from './candidate-card';

interface DraggableCardProps extends AppWithCandidate {
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function DraggableCard({
  application,
  candidate,
  onOpen,
  onDelete,
}: DraggableCardProps) {
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
      <CandidateCard
        candidate={candidate}
        onClick={onOpen}
        onDelete={onDelete}
      />
    </div>
  );
}
