import { avatarBg } from '@/lib/candidate-styles';
import type { ActivityIconName } from '@/lib/activity-actions';
import type { ActivityActor, ActivityTone } from '@/lib/activity-sentence';
import { cn } from '@/lib/utils';
import { CogIcon, SparklesIcon } from 'lucide-react';
import { TONE_ACCENT, ACTIVITY_ICON } from './activity-config';

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
export function ActorAvatar({
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
