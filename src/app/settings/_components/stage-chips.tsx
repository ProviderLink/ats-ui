import type { PipelineTemplate } from '@/store/types';

export function StageChips({ stages }: { stages: PipelineTemplate['stages'] }) {
  const active = stages.filter(s => s.isActive);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {active.slice(0, 4).map(s => (
        <span
          key={s._id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
          style={{
            background: `${s.color}18`,
            borderColor: `${s.color}55`,
            color: s.color,
          }}
        >
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ background: s.color }}
          />
          {s.name}
        </span>
      ))}
      {active.length > 4 && (
        <span className="text-xs text-muted-foreground">
          +{active.length - 4} more
        </span>
      )}
    </div>
  );
}
