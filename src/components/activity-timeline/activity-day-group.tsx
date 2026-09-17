/**
 * A day's worth of rows, under a plain muted label with a hairline rule —
 * no pill, no background. The label is the only place a date appears in the
 * list, because each row carries just a relative time on the right.
 */

import { useMemo, useState } from 'react';
import { ActivityDetail } from './activity-detail';
import { ActivityRow } from './activity-row';
import { dotStateFor } from './dot-state';
import { formatAbsolute } from './format';
import type { DaySection } from './grouping';
import { isAutomated, renderSentence, resolveActorName } from './registry';
import type { ActivityRowGroup, SentenceContext } from './types';

export interface ActivityDaySectionProps {
  section: DaySection;
  ctx: Omit<SentenceContext, 'actorName' | 'automated' | 'entityName'>;
  entityName: string | null;
  compact?: boolean;
}

export function ActivityDaySection({
  section,
  ctx,
  entityName,
  compact = false,
}: ActivityDaySectionProps) {
  // One row open at a time keeps the feed's rhythm intact.
  const [openKey, setOpenKey] = useState<string | null>(null);

  const rendered = useMemo(
    () =>
      section.rows.map(row => {
        const entry = row.entries[0]!;
        const actor = resolveActorName(entry);
        const sentenceCtx: SentenceContext = {
          ...ctx,
          entityName,
          actorName: actor.name,
          automated: isAutomated(entry),
        };
        return {
          row,
          entry,
          actorName: actor.name,
          dot: dotStateFor(entry),
          sentence: renderSentence(entry, sentenceCtx),
          expandable: hasDetail(entry),
        };
      }),
    [section.rows, ctx, entityName]
  );

  return (
    <section className="flex flex-col">
      <div className="relative z-10 flex items-center gap-2 pb-1 pt-3 first:pt-0">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground/70">
          {section.label}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border/70" />
      </div>

      <ul role="list" className="flex flex-col">
        {rendered.map(
          ({ row, entry, actorName, dot, sentence, expandable }) => (
            <ActivityRow
              key={row.key}
              actorName={actorName}
              avatarUrl={entry.performerAvatar}
              dot={dot}
              sentence={sentence}
              createdAt={entry.createdAt}
              repeatCount={row.entries.length}
              expandable={expandable}
              expanded={openKey === row.key}
              onToggle={() =>
                setOpenKey(current => (current === row.key ? null : row.key))
              }
              compact={compact}
            >
              {row.collapsed ? (
                <CollapsedGroup entries={row.entries} />
              ) : (
                <ActivityDetail entry={entry} />
              )}
            </ActivityRow>
          )
        )}
      </ul>
    </section>
  );
}

/** The individual entries a collapsed row stands for. */
function CollapsedGroup({ entries }: { entries: ActivityRowGroup['entries'] }) {
  return (
    <div className="mt-1 mr-2 mb-2 ml-11 flex flex-col gap-1.5">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="flex items-baseline justify-between gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-1.5 text-xs"
        >
          <span className="text-foreground/80">
            {entry.description?.trim() || describeChange(entry)}
          </span>
          <span
            className="shrink-0 text-muted-foreground/70"
            title={formatAbsolute(entry.createdAt)}
          >
            {formatAbsolute(entry.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A collapsed entry's own `changes`, or a last-resort honest label. */
function describeChange(entry: ActivityRowGroup['entries'][number]): string {
  const changes = entry.metadata['changes'];
  if (Array.isArray(changes) && changes.length > 0) {
    return changes
      .slice(0, 3)
      .map(item => String(item))
      .join('; ');
  }
  return 'No additional detail';
}

/** True when the expanded block would show something. */
function hasDetail(entry: ActivityRowGroup['entries'][number]): boolean {
  if (entry.description?.trim()) return true;
  if (entry.legacyType) return true;
  if (Array.isArray(entry.metadata['changes'])) {
    return (entry.metadata['changes'] as unknown[]).length > 0;
  }
  // Any string metadata that the allowlist kept is worth showing.
  return Object.values(entry.metadata).some(
    value => typeof value === 'string' && value.trim() !== ''
  );
}
