import { useApplicationStore } from '@/store';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { buildStageMap, type AppWithCandidate } from '../_utils/pipeline-board';

export function usePipelineBoardDnd(
  pairs: AppWithCandidate[],
  firstStageId?: string
) {
  const moveStage = useApplicationStore(s => s.moveStage);
  const [stageMap, setStageMap] = useState<Record<string, string>>(() =>
    buildStageMap(pairs, firstStageId)
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Re-sync when the underlying data changes (server-side stage moves, job
  // switch, approving a new candidate). The signature covers the candidate
  // join too — otherwise applications arriving before candidates would
  // snapshot an empty map and never recover.
  const stageSignature = `${pairs
    .map(
      p =>
        `${p.application._id}:${p.application.currentStage?.stageId ?? ''}:${p.application.phase}`
    )
    .join('|')}|cands:${pairs.length}`;
  useEffect(() => {
    setStageMap(buildStageMap(pairs, firstStageId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSignature]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function onDragEnd({ over }: DragEndEvent) {
    if (over && activeId) {
      const newStageId = over.id as string;
      setStageMap(prev => ({ ...prev, [activeId]: newStageId }));
      await moveStage(activeId, newStageId);
    }
    setActiveId(null);
  }

  return {
    sensors,
    stageMap,
    activeItem: pairs.find(p => p.application._id === activeId),
    onDragStart,
    onDragEnd,
  };
}
