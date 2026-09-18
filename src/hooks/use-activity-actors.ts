/**
 * Resolve the human behind an activity log entry.
 *
 * The backend stores `performedBy` as a bare User ObjectId and never
 * populates a display name. Rather than adding a per-log lookup endpoint, we
 * resolve performers from `useUserStore`, which is boot-loaded with the full
 * team list (`limit: 9999`) and persisted, so the data is already on the
 * client for every role that can read activity logs.
 */
import type { ActivityActor } from '@/lib/activity-sentence';
import { useAuthStore } from '@/store/slices/auth.store';
import { useUserStore } from '@/store/slices/users.store';
import type { ActivityLog } from '@/store/types';
import type { User } from '@/store/types/user.types';
import { useCallback, useMemo } from 'react';

/** Display name for events the AI engine produced. */
export const AI_ACTOR_NAME = 'AI';
/** Display name for events produced by schedulers / cron / public traffic. */
export const SYSTEM_ACTOR_NAME = 'System';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

/** Actions written by background AI jobs. */
const AI_ACTIONS = new Set([
  'parsed_data_updated',
  'ai_score_updated',
  'ai_validation_updated',
  'resume_parsing_completed',
  'resume_validation_completed',
  'candidate_scoring_completed',
  'candidacy_validation_completed',
]);

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

export function displayNameOf(user: User | null | undefined): string {
  if (!user) return '';
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
}

interface ActorMaps {
  byId: Map<string, User>;
  /** Backend never sets `performerName`; honour it if a future API does. */
  byName: Set<string>;
}

export interface ActivityActors {
  /** Resolve the actor for one log entry. Stable across renders. */
  resolve: (log: ActivityLog) => ActivityActor;
}

function makeActor(params: {
  kind: ActivityActor['kind'];
  id: string | null;
  name: string;
  avatar: string | null;
  isViewer: boolean;
}): ActivityActor {
  return { ...params, initials: initialsOf(params.name) };
}

export function useActivityActors(): ActivityActors {
  const users = useUserStore(s => s.items);
  const authUser = useAuthStore(s => s.user);

  const maps = useMemo<ActorMaps>(() => {
    const byId = new Map<string, User>();
    const byName = new Set<string>();
    for (const user of users) {
      byId.set(user._id, user);
      const name = displayNameOf(user);
      if (name) byName.add(name);
    }
    return { byId, byName };
  }, [users]);

  const viewerId = authUser?._id ?? null;

  const resolve = useCallback(
    (log: ActivityLog): ActivityActor => {
      const performerId = str(log.performedBy);
      const explicitName = str(log.performerName);

      // ── A real user performed the action ──────────────────────────
      const matchedById = performerId ? maps.byId.get(performerId) : undefined;
      if (matchedById) {
        const name = displayNameOf(matchedById);
        return makeActor({
          kind: 'user',
          id: matchedById._id,
          name,
          avatar: matchedById.avatar ?? null,
          isViewer: matchedById._id === viewerId,
        });
      }

      // ── The current user, not yet present in the team list ────────
      if (performerId && viewerId && performerId === viewerId && authUser) {
        const name = displayNameOf(authUser as User);
        return makeActor({
          kind: 'user',
          id: performerId,
          name: name || SYSTEM_ACTOR_NAME,
          avatar: authUser.avatar ?? null,
          isViewer: true,
        });
      }

      // ── Fall back to a populated name from a future API ───────────
      if (explicitName && !OBJECT_ID_RE.test(explicitName)) {
        return makeActor({
          kind: 'user',
          id: performerId,
          name: explicitName,
          avatar: str(log.performerAvatar),
          isViewer: false,
        });
      }

      // ── No user: attribute to the engine that actually ran it ─────
      const key = String(log.action ?? '').toLowerCase();
      const isAi = AI_ACTIONS.has(key);
      return makeActor({
        kind: isAi ? 'ai' : 'system',
        id: null,
        name: isAi ? AI_ACTOR_NAME : SYSTEM_ACTOR_NAME,
        avatar: null,
        isViewer: false,
      });
    },
    [maps, viewerId, authUser]
  );

  return { resolve };
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}
