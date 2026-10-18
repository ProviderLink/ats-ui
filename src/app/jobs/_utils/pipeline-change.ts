import type { Application, StageShape } from '@/store';

export interface StageSummary {
  oldStage: StageShape;
  candidateCount: number;
  matched: boolean;
  newStageName: string;
}

export interface RemapRow {
  oldStageName: string;
  candidateCount: number;
  selectedNewStageName: string;
  wasAutoMatched: boolean;
}

export function buildStageSummary(
  applications: Application[],
  oldStages: StageShape[],
  newStages: StageShape[]
): StageSummary[] {
  if (!applications.length || !oldStages.length) return [];

  const newStageNames = new Set(newStages.map(s => s.name.toLowerCase()));
  const countByStageName = new Map<string, number>();
  for (const app of applications) {
    const name = app.currentStage?.stageName;
    if (name) countByStageName.set(name, (countByStageName.get(name) ?? 0) + 1);
  }

  return oldStages.map(oldStage => {
    const matched = newStageNames.has(oldStage.name.toLowerCase());
    return {
      oldStage,
      candidateCount: countByStageName.get(oldStage.name) ?? 0,
      matched,
      newStageName: matched ? oldStage.name : (newStages[0]?.name ?? 'Stage 1'),
    };
  });
}

export function summaryToRemapRows(summary: StageSummary[]): RemapRow[] {
  return summary.map(s => ({
    oldStageName: s.oldStage.name,
    candidateCount: s.candidateCount,
    selectedNewStageName: s.newStageName,
    wasAutoMatched: s.matched,
  }));
}
