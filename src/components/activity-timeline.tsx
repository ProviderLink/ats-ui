import { avatarBg } from '@/app/candidates/_utils/candidate-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityActors } from '@/hooks/use-activity-actors';
import {
  buildActivitySentence,
  formatActivityClock,
  formatActivityDay,
  formatActivityTime,
  type ActivityActor,
  type ActivityContext,
  type ActivityIconName,
  type ActivitySentence,
  type ActivityTone,
} from '@/lib/activity-sentence';
import { cn } from '@/lib/utils';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import {
  ActivityResourceType,
  type ActivityLog,
  type ActivityResourceType as ActivityResourceTypeValue,
} from '@/store/types';
import {
  ActivityIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BanIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CalendarXIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  CirclePauseIcon,
  CirclePlayIcon,
  ClipboardCheckIcon,
  CogIcon,
  ContactIcon,
  FilePlusIcon,
  FileSearchIcon,
  FileTextIcon,
  GaugeIcon,
  GitBranchIcon,
  HandshakeIcon,
  LockIcon,
  MailIcon,
  MessageSquarePlusIcon,
  NotebookPenIcon,
  PenLineIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  SparklesIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UnlockIcon,
  UserCheckIcon,
  UserCogIcon,
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  WalletIcon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

/**
 * Ink colour per semantic tone. Only the glyph that stands in for a missing
 * performer uses it — the sentences themselves stay in foreground ink so a long
 * feed reads as plain prose rather than a wall of coloured labels.
 */
const TONE_ACCENT: Record<ActivityTone, string> = {
  success: 'text-emerald-700 dark:text-emerald-400',
  danger: 'text-red-700 dark:text-red-400',
  warning: 'text-amber-700 dark:text-amber-400',
  info: 'text-pine-teal-700 dark:text-pine-teal-300',
  ai: 'text-violet-700 dark:text-violet-400',
  neutral: 'text-muted-foreground',
};

/**
 * Glyph for an event.
 *
 * Used as the avatar of an entry that names no performer, so the row still
 * says what kind of event it was (created, moved, cancelled, scored…).
 */
const ACTIVITY_ICON: Record<ActivityIconName, LucideIcon> = {
  // lifecycle
  plus: PlusIcon,
  check: CheckCircle2Icon,
  'check-double': CheckCheckIcon,
  x: XCircleIcon,
  ban: BanIcon,
  trash: Trash2Icon,
  'file-plus': FilePlusIcon,
  // change
  pencil: PencilIcon,
  swap: ArrowLeftRightIcon,
  refresh: RefreshCwIcon,
  // pipeline
  'arrow-right': ArrowRightIcon,
  branch: GitBranchIcon,
  // interview
  'calendar-plus': CalendarPlusIcon,
  'calendar-x': CalendarXIcon,
  'calendar-check': CalendarCheckIcon,
  'calendar-clock': CalendarClockIcon,
  'clipboard-check': ClipboardCheckIcon,
  'message-plus': MessageSquarePlusIcon,
  // AI
  sparkles: SparklesIcon,
  scan: FileSearchIcon,
  'badge-check': BadgeCheckIcon,
  'shield-x': ShieldXIcon,
  // people / client
  'user-plus': UserPlusIcon,
  'user-check': UserCheckIcon,
  'user-minus': UserMinusIcon,
  'user-gear': UserCogIcon,
  contact: ContactIcon,
  building: Building2Icon,
  handshake: HandshakeIcon,
  // work
  star: StarIcon,
  'star-off': StarOffIcon,
  briefcase: BriefcaseBusinessIcon,
  'circle-play': CirclePlayIcon,
  'circle-pause': CirclePauseIcon,
  'timer-off': CirclePauseIcon,
  gauge: GaugeIcon,
  wallet: WalletIcon,
  notes: NotebookPenIcon,
  'pen-line': PenLineIcon,
  mail: MailIcon,
  settings: SettingsIcon,
  lock: LockIcon,
  unlock: UnlockIcon,
  'shield-check': ShieldCheckIcon,
  alert: TriangleAlertIcon,
  activity: ActivityIcon,
};

const RESOURCE_ICON: Record<ActivityResourceTypeValue | string, ReactNode> = {
  [ActivityResourceType.candidate]: <UserIcon className="size-3" />,
  [ActivityResourceType.client]: <Building2Icon className="size-3" />,
  [ActivityResourceType.job]: <BriefcaseBusinessIcon className="size-3" />,
  [ActivityResourceType.application]: <FileTextIcon className="size-3" />,
  [ActivityResourceType.interview]: <CalendarClockIcon className="size-3" />,
  [ActivityResourceType.user]: <UserRoundCheckIcon className="size-3" />,
  [ActivityResourceType.assignment]: (
    <BriefcaseBusinessIcon className="size-3" />
  ),
  [ActivityResourceType.tag]: <TagIcon className="size-3" />,
  [ActivityResourceType.eod]: <NotebookPenIcon className="size-3" />,
  [ActivityResourceType.performance_review]: <GaugeIcon className="size-3" />,
  [ActivityResourceType.survey]: <MailIcon className="size-3" />,
  [ActivityResourceType.work_entry]: <NotebookPenIcon className="size-3" />,
  [ActivityResourceType.settings]: <SettingsIcon className="size-3" />,
};

/** An uninformative "edited …" row with no detail line, safe to fold. */
function isFoldable(sentence: ActivitySentence): boolean {
  return sentence.detail === null && sentence.text.startsWith('edited ');
}

/** Stable reference for feeds that have not loaded yet. */
const EMPTY_LOGS: ActivityLog[] = [];

export interface ActivityTimelineProps {
  /** The kind of entity this feed belongs to. Required for self-fetch mode. */
  resourceType: ActivityResourceTypeValue | string;
  /** The entity id. Invalid/placeholder ids short-circuit to an empty state. */
  resourceId: string;
  /** Optional heading rendered above the feed. Defaults to no heading. */
  heading?: string;
  /** Show the resource-type label under each entry (useful in the global feed
   * where several resource types are interleaved). Entity-scoped views leave
   * this off to keep the list compact. */
  showResourceIcon?: boolean;
  /** Max entries to render before the container scrolls internally. */
  maxItems?: number;
  /** Compact variant — tighter padding for dense side sheets. */
  compact?: boolean;
  className?: string;
  /** Pre-loaded logs. When provided, the component skips self-fetching and
   * renders exactly these entries — useful for the global feed where filters
   * change the dataset every query. */
  logs?: ActivityLog[];
  /** External loading flag — only used together with `logs`. */
  loading?: boolean;
  /** Extra entries merged into the feed by time — e.g. a candidate's emails,
   * which live in their own collection rather than in the activity log. */
  extraLogs?: ActivityLog[];
}

/**
 * Activity feed rendered as a vertical timeline. Two modes:
 *
 * 1. Self-fetch (default): pulls the per-entity feed from
 *    `useActivityLogStore.fetchForEntity`, cached by `${resourceType}|${resourceId}`.
 * 2. Controlled: pass `logs` (and optionally `loading`) to render entries you
 *    already have.
 *
 * Each row leads with the performer's avatar and a tone badge, followed by a
 * single plain sentence:
 *
 *   **Cyril Thomas** moved the candidate from Phone Screen to Offer   14:32
 *   Reason: Skills mismatch
 *
 * Rows with no recorded performer carry the event glyph in the avatar slot and
 * drop the corner badge, which would otherwise repeat it (see `ActorAvatar`).
 *
 * The performer is resolved client-side from the boot-loaded user list, so no
 * extra API calls are made. To update optimistically after a mutation, call
 * `useActivityLogStore.getState()._prepend(resourceType, resourceId, log)`.
 */
export function ActivityTimeline({
  resourceType,
  resourceId,
  heading,
  showResourceIcon = false,
  maxItems = 200,
  compact = false,
  className,
  logs: controlledLogs,
  loading: controlledLoading,
  extraLogs,
}: ActivityTimelineProps) {
  const feeds = useActivityLogStore(s => s.feeds);
  const storeLoading = useActivityLogStore(s => s.loading);
  const loadError = useActivityLogStore(s => s.error);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const { resolve } = useActivityActors();

  const key = `${resourceType}|${resourceId}`;
  const isControlled = controlledLogs !== undefined;
  const baseLogs: ActivityLog[] = isControlled
    ? controlledLogs
    : (feeds[key] ?? EMPTY_LOGS);
  const logs = useMemo(() => {
    const extra = (extraLogs ?? []).filter(e => e.resourceId === resourceId);
    if (extra.length === 0) return baseLogs;
    return [...baseLogs, ...extra].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [baseLogs, extraLogs, resourceId]);

  // Lookups the sentences use to name a job or print an interview time.
  const jobs = useJobStore(s => s.items);
  const companyTimezone = useSettingsStore(s => s.settings?.companyTimezone);
  const context = useMemo<ActivityContext>(() => {
    const titles = new Map(jobs.map(j => [j._id, j.title]));
    return { jobTitle: id => titles.get(id) ?? null, timeZone: companyTimezone };
  }, [jobs, companyTimezone]);
  const loading = isControlled ? !!controlledLoading : storeLoading;

  // Self-fetch mode: trigger a fetch on mount and whenever the entity changes.
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isControlled) return;
    if (lastIdRef.current === resourceId) return;
    lastIdRef.current = resourceId;
    void fetchForEntity(resourceType, resourceId);
  }, [isControlled, resourceType, resourceId, fetchForEntity]);

  const shown = useMemo(() => logs.slice(0, maxItems), [logs, maxItems]);
  const isLoading = loading && logs.length === 0;

  // Build the render model once per data change, grouped by calendar day so the
  // rows themselves only need to show a clock time.
  const groups = useMemo(() => {
    const now = new Date();
    const result: {
      day: string;
      items: {
        log: ActivityLog;
        actor: ActivityActor;
        sentence: ActivitySentence;
        time: ReturnType<typeof formatActivityTime>;
        /** How many identical entries this row stands for. */
        count: number;
        /** Timestamp of the oldest entry folded into this row. */
        fromAt: string;
      }[];
    }[] = [];
    for (const log of shown) {
      const day = formatActivityDay(log.createdAt, now);
      const actor = resolve(log);
      const item = {
        log,
        actor,
        sentence: buildActivitySentence(log, actor, context),
        time: formatActivityTime(log.createdAt, now),
        count: 1,
        fromAt: log.createdAt,
      };
      const last = result[result.length - 1];
      if (last && last.day === day) {
        // Old "edited the …" rows say nothing about what changed, so a run of
        // them by the same person folds into one row instead of padding the
        // feed. Nothing is hidden: the count and time range stay visible.
        const prev = last.items[last.items.length - 1];
        if (
          prev &&
          isFoldable(prev.sentence) &&
          isFoldable(item.sentence) &&
          prev.sentence.text === item.sentence.text &&
          prev.actor.id === item.actor.id &&
          prev.actor.name === item.actor.name
        ) {
          prev.count += 1;
          prev.fromAt = log.createdAt;
        } else {
          last.items.push(item);
        }
      } else result.push({ day, items: [item] });
    }
    return result;
  }, [shown, resolve, context]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {heading && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{heading}</h4>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <ActivityIcon className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {!isControlled && loadError
              ? /permission/i.test(loadError)
                ? 'You don\u2019t have access to this activity.'
                : 'Couldn\u2019t load activity.'
              : 'No activity yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(group => (
            <section key={group.day} className="flex flex-col">
              <h5 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.day}
              </h5>
              <ol className="flex flex-col divide-y divide-border/50">
                {group.items.map((item, idx) => (
                  <ActivityItem
                    key={item.log._id ?? idx}
                    log={item.log}
                    actor={item.actor}
                    sentence={item.sentence}
                    time={item.time}
                    count={item.count}
                    fromAt={item.fromAt}
                    showResourceIcon={showResourceIcon}
                    compact={compact}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One row: who (avatar + name) · what (one short sentence, optional detail
 * line) · when (clock time; the day heading above carries the date).
 */
function ActivityItem({
  log,
  actor,
  sentence,
  time,
  count,
  fromAt,
  showResourceIcon,
  compact,
}: {
  log: ActivityLog;
  actor: ActivityActor;
  sentence: ActivitySentence;
  time: ReturnType<typeof formatActivityTime>;
  count: number;
  fromAt: string;
  showResourceIcon?: boolean;
  compact?: boolean;
}) {
  // `sentence.actor` is the single source of truth for whether a performer is
  // named (see `showActor` in `activity-sentence.ts`). A row that names nobody
  // gets the event glyph in the avatar slot instead of a person.
  const hasActor = sentence.actor !== null;

  return (
    <li className={cn('flex items-start gap-3', compact ? 'py-2' : 'py-2.5')}>
      <ActorAvatar
        actor={actor}
        icon={sentence.icon}
        tone={sentence.tone}
        impersonal={!hasActor}
      />

      <div className="min-w-0 flex-1">
        {/* `first-letter:uppercase` keeps the capital in one place whether the
            row leads with a name or an impersonal clause. */}
        <p className="text-sm leading-snug break-words first-letter:uppercase">
          {sentence.actor && (
            <span className="font-medium text-foreground">
              {sentence.actor}{' '}
            </span>
          )}
          <span className="text-foreground/80">{sentence.text}</span>
          {count > 1 && (
            <span className="text-muted-foreground tabular-nums">
              {' '}
              ×{count}
            </span>
          )}
        </p>

        {sentence.detail && (
          <p className="mt-0.5 text-xs leading-relaxed break-words text-muted-foreground">
            {sentence.detail}
          </p>
        )}

        {showResourceIcon && log.resourceType && (
          <div className="mt-1 flex items-center gap-1 text-[11px] capitalize text-muted-foreground">
            {RESOURCE_ICON[log.resourceType] ?? (
              <ActivityIcon className="size-3" />
            )}
            <span>{log.resourceType.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      {time.label && (
        <time
          dateTime={time.dateTime}
          title={time.absolute}
          className="shrink-0 pt-px text-[11px] leading-snug tabular-nums text-muted-foreground"
        >
          {count > 1
            ? `${formatActivityClock(fromAt)}\u2013${formatActivityClock(log.createdAt)}`
            : formatActivityClock(log.createdAt)}
        </time>
      )}
    </li>
  );
}

const ACTOR_AVATAR_SIZE = 24;

/**
 * Actor avatar — who performed the event.
 *
 * A named performer gets an identity mark: users their photo or coloured
 * initials (same palette as the team and candidate tables), AI a violet
 * sparkle, a scheduler/cron a cog. A person is never implied where an engine
 * acted.
 *
 * A row that names nobody has no "who" to show. That slot used to hold a
 * `BanIcon` (a circle with a slash) on EVERY such row, which read as "blocked
 * / cancelled" on events that are neither — a public application, an edit
 * whose actor was never written. The event glyph moves into the avatar
 * instead, so the row's most prominent mark says what happened (a pencil for
 * an edit, a paper-plus for an application) and carries the tone as its ink,
 * exactly as the badge does when a performer IS named.
 */
function ActorAvatar({
  actor,
  icon,
  tone,
  impersonal,
}: {
  actor: ActivityActor;
  /** Event glyph, used as the avatar when no performer is named. */
  icon: ActivityIconName;
  /** Ink colour for that glyph — the tone the badge would have used. */
  tone: ActivityTone;
  /** True when the sentence names no actor, so there is no identity to show. */
  impersonal: boolean;
}) {
  const size = { width: ACTOR_AVATAR_SIZE, height: ACTOR_AVATAR_SIZE };

  if (impersonal) {
    // Legacy rows resolve to the generic `activity` glyph, so they stay
    // plainly uninterpreted rather than dressed up as a known event.
    const EventIcon = ACTIVITY_ICON[icon];
    return (
      <span
        style={size}
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-muted',
          TONE_ACCENT[tone]
        )}
      >
        <EventIcon className="size-3.5" />
      </span>
    );
  }

  if (actor.kind === 'user') {
    return (
      <span
        style={size}
        className={cn(
          'grid shrink-0 select-none place-items-center overflow-hidden rounded-full text-[10px] font-semibold',
          !actor.avatar && avatarBg(actor.name || '?')
        )}
      >
        {actor.avatar ? (
          <img
            src={actor.avatar}
            alt={actor.name}
            className="size-full object-cover"
          />
        ) : (
          actor.initials
        )}
      </span>
    );
  }

  if (actor.kind === 'ai') {
    return (
      <span
        style={size}
        // A hairline keeps the violet disc from reading as a flat blob against
        // the muted avatar slot. The shade is picked to land at the same
        // ~1.5:1 edge strength as `ui/avatar.tsx`'s own `after:border-border`,
        // so AI avatars sit at the house standard rather than louder or
        // fainter than every other avatar in the app. `border-box` is set
        // globally in Tailwind's preflight, so the fixed 26px size is
        // unchanged by the 1px edge.
        className="grid shrink-0 place-items-center rounded-full border border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-800/70 dark:bg-violet-950/60 dark:text-violet-300"
      >
        <SparklesIcon className="size-3.5" />
      </span>
    );
  }

  // A genuinely automated event that the sentence does credit to "System" —
  // a cron compliance sweep or a dispatched survey. It gets a machine glyph
  // so it is not mistaken for a person, and keeps its event badge.
  return (
    <span
      style={size}
      className="grid shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
    >
      <CogIcon className="size-3.5" />
    </span>
  );
}
