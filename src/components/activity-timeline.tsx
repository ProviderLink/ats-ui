import { avatarBg } from '@/app/candidates/_utils/candidate-styles';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useActivityActors } from '@/hooks/use-activity-actors';
import {
  buildActivitySentence,
  formatActivityTime,
  type ActivityActor,
  type ActivityIconName,
  type ActivitySentence,
  type ActivityTone,
} from '@/lib/activity-sentence';
import { cn } from '@/lib/utils';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
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
  CircleHelpIcon,
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
 * Accent styling per semantic tone.
 *
 * Only the small badge on the avatar and the "recent" timestamp carry colour —
 * the sentence itself stays in foreground ink so a long list of events reads as
 * prose rather than as a wall of coloured labels.
 *
 * The badge tints are tuned so the glyph keeps ≥3:1 contrast against its own
 * background (the WCAG minimum for a non-text graphic). Measured, light mode:
 * emerald 3.65, red 4.77, violet 5.89, teal 7.41, grey 12.2. Amber is the
 * exception — even `amber-700` only reached 2.1:1 against a white glyph, so the
 * warning badge drops the solid fill for an amber tint with dark ink.
 */
const TONE_STYLES: Record<ActivityTone, { badge: string; accent: string }> = {
  success: {
    badge:
      'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  danger: {
    badge: 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950',
    accent: 'text-red-700 dark:text-red-400',
  },
  warning: {
    // Tinted, not solid — see the contrast note above.
    badge:
      'bg-amber-400 text-amber-950 ring-amber-200/70 dark:bg-amber-500 dark:text-amber-950 dark:ring-amber-900/50',
    accent: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    badge:
      'bg-pine-teal-700 text-white dark:bg-pine-teal-500 dark:text-pine-teal-950',
    accent: 'text-pine-teal-700 dark:text-pine-teal-300',
  },
  ai: {
    badge: 'bg-violet-600 text-white dark:bg-violet-500 dark:text-violet-950',
    accent: 'text-violet-700 dark:text-violet-400',
  },
  neutral: {
    badge: 'bg-muted-foreground text-background',
    accent: 'text-muted-foreground',
  },
};

/**
 * Badge geometry.
 *
 * A 13px badge forces lucide's 24-unit artwork down to ~9px, where the default
 * 2-unit stroke renders as a ~0.7px hairline that muddies complex glyphs. 15px
 * with a 2.4 stroke keeps the outline ~1.1px so each icon stays legible.
 */
const BADGE_SIZE = 15;
const BADGE_ICON_SIZE = 10;
const BADGE_STROKE = 2.4;

/**
 * Glyph for the badge on the actor avatar.
 *
 * The icon communicates the KIND of event (created, moved, cancelled, scored…)
 * and the badge colour communicates its meaning (success, danger, AI…), so the
 * two are resolved independently — a pass/fail AI verdict, for instance, reuses
 * the check/shield glyphs rather than a generic sparkle.
 *
 * Sizing and stroke are applied once in `ActivityBadge` rather than repeated
 * on every entry, so adding an icon here cannot introduce an inconsistent size.
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

/**
 * Neutral grey badge for an entry whose event kind could not be determined,
 * so a legacy row reads as unknown rather than being disguised as a known event.
 */
const LEGACY_BADGE =
  'bg-muted-foreground/60 text-background dark:bg-muted-foreground/50';

/**
 * The badge that sits on the lower-right of the actor avatar.
 *
 * Renders a distinct glyph per event kind, tinted by tone. Legacy rows (whose
 * event kind could not be determined) get a neutral grey badge with a question
 * mark so they are never mistaken for a known event.
 */
function ActivityBadge({
  icon,
  tone,
  isLegacy,
}: {
  icon: ActivityIconName;
  tone: ActivityTone;
  isLegacy: boolean;
}) {
  const Icon = ACTIVITY_ICON[icon];

  return (
    <span
      aria-hidden
      style={{ width: BADGE_SIZE, height: BADGE_SIZE }}
      className={cn(
        'absolute -right-1 -bottom-1 grid place-items-center rounded-full ring-2 ring-card',
        isLegacy ? LEGACY_BADGE : TONE_STYLES[tone].badge
      )}
    >
      {isLegacy ? (
        <CircleHelpIcon size={BADGE_ICON_SIZE} strokeWidth={BADGE_STROKE} />
      ) : (
        // Size + stroke applied once here, so every entry of the map above is
        // guaranteed to render identically.
        <Icon size={BADGE_ICON_SIZE} strokeWidth={BADGE_STROKE} />
      )}
    </span>
  );
}

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
}: ActivityTimelineProps) {
  const feeds = useActivityLogStore(s => s.feeds);
  const storeLoading = useActivityLogStore(s => s.loading);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const { resolve } = useActivityActors();

  const key = `${resourceType}|${resourceId}`;
  const isControlled = controlledLogs !== undefined;
  const logs: ActivityLog[] = isControlled
    ? controlledLogs
    : (feeds[key] ?? EMPTY_LOGS);
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

  // Build the render model once per data change instead of on every item render.
  const items = useMemo(() => {
    const now = new Date();
    return shown.map(log => {
      const actor = resolve(log);
      return {
        log,
        actor,
        sentence: buildActivitySentence(log, actor),
        time: formatActivityTime(log.createdAt, now),
      };
    });
  }, [shown, resolve]);

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
              <Skeleton className="size-7 rounded-full" />
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
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <ol className="relative flex flex-col">
          {/* vertical spine, centred under the avatar column */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-3 bottom-3 w-px bg-border-subtle"
          />
          {items.map((item, idx) => (
            <ActivityItem
              key={item.log._id ?? idx}
              log={item.log}
              actor={item.actor}
              sentence={item.sentence}
              time={item.time}
              showResourceIcon={showResourceIcon}
              compact={compact}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function ActivityItem({
  log,
  actor,
  sentence,
  time,
  showResourceIcon,
  compact,
}: {
  log: ActivityLog;
  actor: ActivityActor;
  sentence: ActivitySentence;
  time: ReturnType<typeof formatActivityTime>;
  showResourceIcon?: boolean;
  compact?: boolean;
}) {
  const tone = TONE_STYLES[sentence.tone];
  const isImpersonal = actor.kind === 'system';
  const isLegacy = sentence.isLegacy;

  // Lines rendered UNDER the main sentence. They are what makes the text
  // column taller than the avatar — see the alignment note on the content
  // wrapper below.
  const hasDetailLine = Boolean(sentence.detail);
  const hasResourceLine = showResourceIcon && Boolean(log.resourceType);
  const isSingleLine = !hasDetailLine && !hasResourceLine;

  // Whether this row names a performer. `sentence.actor` is the single source
  // of truth for that decision (see `showActor` in `activity-sentence.ts`) —
  // every row that names nobody, from a public application to an edit whose
  // actor was never recorded, arrives here with `actor: null`.
  const hasActor = sentence.actor !== null;

  // The avatar answers "who did this". When no performer is named there is no
  // "who", so the event glyph itself takes that slot (see `ActorAvatar`) and
  // the corner badge is dropped — it would print the same glyph twice, at two
  // sizes. Legacy rows keep theirs regardless: the question mark is the only
  // thing marking them as uninterpreted.
  const showBadge = hasActor || isLegacy;

  return (
    <li
      className={cn(
        'relative flex items-start gap-3 rounded-lg px-2 -mx-2 transition-colors hover:bg-muted/40',
        compact ? 'py-2' : 'py-2.5'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative z-10 shrink-0">
              <ActorAvatar
                actor={actor}
                icon={sentence.icon}
                tone={sentence.tone}
                impersonal={!hasActor}
              />
              {showBadge && (
                <ActivityBadge
                  icon={sentence.icon}
                  tone={sentence.tone}
                  isLegacy={isLegacy}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">{time.absolute || 'Unknown time'}</p>
            {!isImpersonal && (
              <p className="text-xs text-muted-foreground">
                {actor.isViewer ? 'You' : actor.name}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div
        // The avatar is a fixed 26px square. A row with a detail/resource line
        // grows taller than that, so top-alignment reads correctly; a row with
        // ONLY the main sentence is ~19px and would otherwise hug the top with
        // dead space under it. Forcing the single-line row to the avatar's
        // height and centring its contents keeps the ink optically parallel to
        // the avatar in both cases.
        style={isSingleLine ? { minHeight: ACTOR_AVATAR_SIZE } : undefined}
        className={cn(
          'flex min-w-0 flex-1 gap-3',
          isSingleLine ? 'items-center' : 'items-start'
        )}
      >
        <div className="min-w-0 flex-1">
          {/* `first-letter:uppercase` keeps the guarantee in one place whether
              the row leads with an actor name or an impersonal clause —
              sentence fragments themselves stay lowercase for composition. */}
          <p className="text-sm leading-snug break-words first-letter:uppercase">
            {sentence.actor && (
              <span className="font-medium text-foreground">
                {sentence.actor}{' '}
              </span>
            )}
            <span className="text-foreground/90">{sentence.text}</span>
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

        {/* Timestamp sits in its own right-aligned column so it reads as
            metadata rather than as part of the sentence. The 1px nudge only
            applies to top-aligned rows — a centred single-line row needs no
            compensation. */}
        {time.label && (
          <time
            dateTime={time.dateTime}
            title={time.absolute}
            className={cn(
              'shrink-0 whitespace-nowrap text-[11px] leading-snug tabular-nums',
              !isSingleLine && 'pt-px',
              time.isRecent ? tone.accent : 'text-muted-foreground/80'
            )}
          >
            {time.label}
          </time>
        )}
      </div>
    </li>
  );
}

const ACTOR_AVATAR_SIZE = 26;

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
          TONE_STYLES[tone].accent
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
