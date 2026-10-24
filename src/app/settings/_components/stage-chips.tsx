import type { PipelineTemplate } from '@/store/types';

// Tinted from the stage's own colour via a CSS variable: stronger fill, border
// and a darkened label in light mode; the original faint tint in dark mode.
export const STAGE_CHIP_CLS =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ' +
  'border-[color-mix(in_srgb,var(--stage)_60%,transparent)] bg-[color-mix(in_srgb,var(--stage)_22%,transparent)] text-[color-mix(in_srgb,var(--stage)_60%,black)] ' +
  'dark:border-[color-mix(in_srgb,var(--stage)_33%,transparent)] dark:bg-[color-mix(in_srgb,var(--stage)_9%,transparent)] dark:text-(--stage)';

export function StageChips({ stages }: { stages: PipelineTemplate['stages'] }) {
  const active = stages.filter(s => s.isActive);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {active.slice(0, 4).map(s => (
        <span
          key={s._id}
          className={STAGE_CHIP_CLS}
          style={{ '--stage': s.color } as React.CSSProperties}
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
