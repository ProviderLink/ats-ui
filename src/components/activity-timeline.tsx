import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { htmlToPlainText, summarizeText } from '@/lib/html';
import { cn, timeAgo } from '@/lib/utils';
import { useActivityLogStore } from '@/store/slices/activity-logs.store';
import {
  ActivityResourceType,
  type ActivityLog,
  type ActivityResourceType as ActivityResourceTypeValue,
} from '@/store/types';
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  BanIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  FileTextIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusCircleIcon,
  StarIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  VideoIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Map an activity `action` token to a presentation icon + tint. */
const TYPE_PRESETS: Record<
  string,
  { icon: ReactNode; iconColor: string; bgClass: string }
> = {
  // ── CRUD core ────────────────────────────────────────────────────────
  CREATED: {
    icon: <PlusCircleIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  APPLIED: {
    icon: <PlusCircleIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  UPDATED: {
    icon: <PencilIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  DELETED: {
    icon: <Trash2Icon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  // ── Lifecycle ────────────────────────────────────────────────────────
  APPROVED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  REJECTED: {
    icon: <XCircleIcon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  HIRED: {
    icon: <UserRoundCheckIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  CANCELLED: {
    icon: <BanIcon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  DEACTIVATED: {
    icon: <BanIcon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  // ── Pipeline / stage ─────────────────────────────────────────────────
  STAGE_MOVED: {
    icon: <ArrowRightIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  STAGE_CHANGED: {
    icon: <ArrowRightIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  PIPELINE_ASSIGNED: {
    icon: <ClipboardListIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  PIPELINE_CHANGED: {
    icon: <ClipboardListIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  STATUS_CHANGED: {
    icon: <TagIcon className="size-3" />,
    iconColor: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/60',
  },
  // ── Interviews ───────────────────────────────────────────────────────
  INTERVIEW_SCHEDULED: {
    icon: <VideoIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  INTERVIEW_CANCELLED: {
    icon: <XCircleIcon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  INTERVIEW_UPDATED: {
    icon: <ClockIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  INTERVIEW_NO_SHOW: {
    icon: <BanIcon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  INTERVIEW_COMPLETED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  INTERVIEW_RESCHEDULED: {
    icon: <ClockIcon />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  FEEDBACK_SUBMITTED: {
    icon: <MessageSquareIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  INTERVIEW_FEEDBACK_SUBMITTED: {
    icon: <MessageSquareIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  // ── Emails / survey ──────────────────────────────────────────────────
  // (email resource type removed; mail icon kept for survey/eod below)
  // ── Contacts ─────────────────────────────────────────────────────────
  CONTACT_ADDED: {
    icon: <UserPlusIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  CONTACT_UPDATED: {
    icon: <PencilIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  CONTACT_REMOVED: {
    icon: <Trash2Icon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  // ── Notes ────────────────────────────────────────────────────────────
  NOTE_ADDED: {
    icon: <MessageSquareIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  NOTE_UPDATED: {
    icon: <PencilIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  NOTE_DELETED: {
    icon: <Trash2Icon className="size-3" />,
    iconColor: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/60',
  },
  // ── CRM ──────────────────────────────────────────────────────────────
  CRM_PROFILE_UPDATED: {
    icon: <Building2Icon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  // ── Talent pool ──────────────────────────────────────────────────────
  TALENT_POOL_ADDED: {
    icon: <StarIcon className="size-3" />,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/60',
  },
  TALENT_POOL_REMOVED: {
    icon: <StarIcon className="size-3" />,
    iconColor: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-50 dark:bg-slate-950/60',
  },
  // ── Permissions / provisioning ───────────────────────────────────────
  PERMISSIONS_UPDATED: {
    icon: <ActivityIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  PROVISIONED_VA: {
    icon: <UserRoundCheckIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  PROVISIONED_CLIENT: {
    icon: <UserRoundCheckIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  // ── AI / parsing ─────────────────────────────────────────────────────
  AI_SCORE_UPDATED: {
    icon: <ActivityIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  AI_VALIDATION_UPDATED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  PARSED_DATA_UPDATED: {
    icon: <FileTextIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  RESUME_PARSING_COMPLETED: {
    icon: <FileTextIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  RESUME_VALIDATION_COMPLETED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  CANDIDATE_SCORING_COMPLETED: {
    icon: <ActivityIcon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  CANDIDACY_VALIDATION_COMPLETED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/60',
  },
  // ── Assignment ───────────────────────────────────────────────────────
  ASSIGNMENT_CREATED: {
    icon: <BriefcaseBusinessIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  ASSIGNMENT_UPDATED: {
    icon: <PencilIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  ASSIGNMENT_STATUS_CHANGED: {
    icon: <TagIcon className="size-3" />,
    iconColor: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/60',
  },
  ASSIGNMENT_ENDED: {
    icon: <BanIcon className="size-3" />,
    iconColor: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-50 dark:bg-slate-950/60',
  },
  // ── EOD ─────────────────────────────────────────────────────────────
  EOD_SUBMITTED: {
    icon: <ClipboardListIcon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  EOD_REMINDER_SENT: {
    icon: <MailIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  // ── Performance review ───────────────────────────────────────────────
  PERFORMANCE_REVIEW_GENERATED: {
    icon: <FileTextIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
  PERFORMANCE_REVIEW_COMPLETED: {
    icon: <CheckCircle2Icon className="size-3" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
  },
  // ── Survey ───────────────────────────────────────────────────────────
  SURVEY_REMINDER_SENT: {
    icon: <MailIcon className="size-3" />,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/60',
  },
  // ── Settings ─────────────────────────────────────────────────────────
  SETTINGS_UPDATED: {
    icon: <ActivityIcon className="size-3" />,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/60',
  },
};

const RESOURCE_ICON: Record<ActivityResourceTypeValue | string, ReactNode> = {
  [ActivityResourceType.candidate]: <UserIcon className="size-4" />,
  [ActivityResourceType.client]: <Building2Icon className="size-4" />,
  [ActivityResourceType.job]: <BriefcaseBusinessIcon className="size-4" />,
  [ActivityResourceType.application]: <ClipboardListIcon className="size-4" />,
  [ActivityResourceType.interview]: <CalendarIcon className="size-4" />,
  [ActivityResourceType.user]: <UserIcon className="size-4" />,
  [ActivityResourceType.assignment]: (
    <BriefcaseBusinessIcon className="size-4" />
  ),
  [ActivityResourceType.tag]: <TagIcon className="size-4" />,
  work_entry: <ClipboardListIcon className="size-4" />,
  settings: <ActivityIcon className="size-4" />,
};

function resolvePreset(log: ActivityLog): {
  icon: ReactNode;
  iconColor: string;
  bgClass: string;
} {
  const FALLBACK = {
    icon: <AlertCircleIcon className="size-3" />,
    iconColor: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-50 dark:bg-slate-950/60',
  };

  const token = String(log.action ?? '').toUpperCase();
  if (!token) {
    const res = RESOURCE_ICON[log.resourceType];
    if (res)
      return {
        icon: res,
        iconColor: 'text-slate-500 dark:text-slate-400',
        bgClass: 'bg-slate-50 dark:bg-slate-950/60',
      };
    return FALLBACK;
  }

  // 1) Exact match
  if (TYPE_PRESETS[token]) return TYPE_PRESETS[token];

  // 2) Suffix match: `CANDIDATE_CREATED` → strip `CANDIDATE_` → `CREATED`
  const parts = token.split('_');
  for (let i = 1; i < parts.length; i++) {
    const suffix = parts.slice(i).join('_');
    if (TYPE_PRESETS[suffix]) return TYPE_PRESETS[suffix];
  }

  // 3) Resource-type icon fallback
  const res = RESOURCE_ICON[log.resourceType];
  if (res)
    return {
      icon: res,
      iconColor: 'text-slate-500 dark:text-slate-400',
      bgClass: 'bg-slate-50 dark:bg-slate-950/60',
    };

  return FALLBACK;
}

// ── Human-readable labels for machine tokens ──────────────────────────────

const TYPE_HUMAN_LABELS: Record<string, string> = {
  CREATED: 'created',
  APPLIED: 'applied',
  UPDATED: 'updated',
  DELETED: 'deleted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIRED: 'hired',
  DEACTIVATED: 'deactivated',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  STAGE_MOVED: 'stage changed',
  STAGE_CHANGED: 'stage changed',
  PIPELINE_ASSIGNED: 'pipeline assigned',
  PIPELINE_CHANGED: 'pipeline changed',
  STATUS_CHANGED: 'changed status',
  INTERVIEW_SCHEDULED: 'interview scheduled',
  INTERVIEW_CANCELLED: 'interview cancelled',
  INTERVIEW_UPDATED: 'interview updated',
  INTERVIEW_NO_SHOW: 'interview no-show',
  INTERVIEW_COMPLETED: 'interview completed',
  INTERVIEW_RESCHEDULED: 'interview rescheduled',
  FEEDBACK_SUBMITTED: 'submitted feedback',
  INTERVIEW_FEEDBACK_SUBMITTED: 'submitted feedback',
  NOTE_ADDED: 'added a note',
  NOTE_UPDATED: 'updated a note',
  NOTE_DELETED: 'deleted a note',
  CONTACT_ADDED: 'added a contact',
  CONTACT_UPDATED: 'updated a contact',
  CONTACT_REMOVED: 'removed a contact',
  CRM_PROFILE_UPDATED: 'updated CRM profile',
  PERMISSIONS_UPDATED: 'updated permissions',
  PROVISIONED_VA: 'provisioned VA user',
  PROVISIONED_CLIENT: 'provisioned client user',
  AI_SCORE_UPDATED: 'AI score updated',
  AI_VALIDATION_UPDATED: 'AI validation completed',
  PARSED_DATA_UPDATED: 'resume parsed',
  RESUME_PARSING_COMPLETED: 'resume parsing completed',
  RESUME_VALIDATION_COMPLETED: 'resume validation completed',
  CANDIDATE_SCORING_COMPLETED: 'candidate scoring completed',
  CANDIDACY_VALIDATION_COMPLETED: 'candidacy validation completed',
  TALENT_POOL_ADDED: 'added to talent pool',
  TALENT_POOL_REMOVED: 'removed from talent pool',
  ASSIGNMENT_CREATED: 'assignment created',
  ASSIGNMENT_UPDATED: 'assignment updated',
  ASSIGNMENT_STATUS_CHANGED: 'assignment status changed',
  ASSIGNMENT_ENDED: 'assignment ended',
  EOD_SUBMITTED: 'EOD submitted',
  EOD_REMINDER_SENT: 'EOD reminder sent',
  PERFORMANCE_REVIEW_GENERATED: 'review generated',
  PERFORMANCE_REVIEW_COMPLETED: 'review completed',
  SURVEY_REMINDER_SENT: 'survey reminder sent',
  SETTINGS_UPDATED: 'settings updated',
};

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalizeWords(s: string) {
  return s
    .split(' ')
    .map(w => capitalizeFirst(w))
    .join(' ');
}

/** Types whose primary meaning is a direct state mutation on the parent
 * resource — they should be rendered as `{ResourceType} {Action}`.
 * Everything else is self-describing and just gets its label capitalised. */
const RESOURCE_PREFIX_TYPES = new Set([
  'CREATED',
  'APPLIED',
  'UPDATED',
  'DELETED',
  'APPROVED',
  'REJECTED',
  'HIRED',
  'DEACTIVATED',
  'SCHEDULED',
  'CANCELLED',
  'COMPLETED',
  'SUBMITTED',
  'REVIEWED',
  'ARCHIVED',
  'RESTORED',
  'WITHDREW',
  'FEEDBACK_ADDED',
  'FEEDBACK_SUBMITTED',
  'ASSIGNED',
  'UNASSIGNED',
]);

/** Build a natural-language sentence from a raw activity log entry.
 *
 * Backend tokens use full `resourceType_action` names like
 * `candidate_created`, `application_stage_moved`, `client_contact_added`.
 * We extract the action suffix and use metadata for extra context. */
function humanizeActivity(log: ActivityLog): string {
  // Prefer a human-written description when it differs from the raw action token.
  if (log.description && log.description !== log.action)
    return capitalizeFirst(log.description);
  if (log.summary && log.summary !== log.action)
    return capitalizeFirst(log.summary);

  const token = String(log.action ?? '');
  const upper = token.toUpperCase();
  const metadata = log.metadata ?? {};
  const resType = capitalizeFirst(log.resourceType || '');

  // ── Full-token match: if the entire token is a known key (e.g.
  //     INTERVIEW_SCHEDULED, FEEDBACK_SUBMITTED), use it directly
  //     instead of peeling off suffixes that would produce a misleading
  //     label like "Application Scheduled". ────────────────────────────
  if (TYPE_HUMAN_LABELS[upper]) {
    return capitalizeWords(TYPE_HUMAN_LABELS[upper]);
  }

  // ── Extract the action suffix from full backend tokens ──────────────
  // `CANDIDATE_CREATED` → `CREATED`, `APPLICATION_STAGE_MOVED` → `STAGE_MOVED`
  const parts = upper.split('_');
  let actionSuffix = upper; // default: use the whole token
  if (parts.length >= 2) {
    // Try progressively shorter suffixes
    for (let i = 1; i < parts.length; i++) {
      const candidate = parts.slice(i).join('_');
      if (
        TYPE_HUMAN_LABELS[candidate] ||
        RESOURCE_PREFIX_TYPES.has(candidate)
      ) {
        actionSuffix = candidate;
        break;
      }
    }
  }

  const base =
    TYPE_HUMAN_LABELS[actionSuffix] ?? token.toLowerCase().replace(/_/g, ' ');

  // ── Context-rich handlers ───────────────────────────────────────────

  // STAGE_MOVED / STAGE_CHANGED: "Candidate moved from Phone Screen to Offer"
  if (actionSuffix === 'STAGE_MOVED' || actionSuffix === 'STAGE_CHANGED') {
    const to =
      metadata.to || metadata.toStage || metadata.stageName || metadata.stage;
    const from = metadata.from || metadata.fromStage;
    if (to && from) return `${resType} moved from ${from} to ${to}`;
    if (to) return `${resType} moved to ${to}`;
    return `${resType} Stage Changed`;
  }

  // STATUS_CHANGED: "Candidate status: pending → approved"
  if (actionSuffix === 'STATUS_CHANGED') {
    const to = metadata.to || metadata.status;
    const from = metadata.from;
    if (to && from)
      return `${resType} status: ${String(from).toLowerCase()} → ${String(to).toLowerCase()}`;
    if (to) return `${resType} changed status to ${String(to).toLowerCase()}`;
    return `${resType} ${capitalizeFirst(base)}`;
  }

  // APPROVED: "Application approved — placed into [Stage]"
  if (actionSuffix === 'APPROVED' && metadata.stageName) {
    return `${resType} approved — placed into ${metadata.stageName}`;
  }

  // ── Name context for verbs that benefit from a known name ───────────
  const name = metadata.name || metadata.contactName || metadata.candidateName;
  if (name && (actionSuffix === 'ASSIGNED' || actionSuffix === 'UNASSIGNED')) {
    return `${resType} ${capitalizeFirst(base)} ${name}`;
  }

  // ── Generic CRUD-type mutations: "Client Updated", "Job Created" ────
  if (RESOURCE_PREFIX_TYPES.has(actionSuffix)) {
    return `${resType} ${capitalizeFirst(base)}`;
  }

  // ── Self-describing types (TALENT_POOL_ADDED, CONTACT_REMOVED, etc.)
  // Already have full human labels → just capitalise.
  if (TYPE_HUMAN_LABELS[actionSuffix]) {
    return capitalizeWords(base);
  }

  // ── Fallback: split snake_case into words ───────────────────────────
  return capitalizeWords(base) || 'Activity';
}

export interface ActivityTimelineProps {
  /** The kind of entity this feed belongs to. Required for self-fetch mode. */
  resourceType: ActivityResourceTypeValue | string;
  /** The entity id. Invalid/placeholder ids short-circuit to an empty state. */
  resourceId: string;
  /** Optional heading rendered above the feed. Defaults to no heading. */
  heading?: string;
  /** Show the resource-type icon next to each entry (useful in the global
   * feed where multiple resource types are interleaved). Entity-scoped views
   * leave this off to keep the list compact. */
  showResourceIcon?: boolean;
  /** Max entries to render before the container scrolls internally. */
  maxItems?: number;
  /** Compact variant — smaller padding for dense side sheets. */
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
 * 1. Self-fetch (default): the component pulls the per-entity feed from
 *    `useActivityLogStore.fetchForEntity` and caches it by
 *    `${resourceType}|${resourceId}`. Re-mounting the same entity reuses the
 *    cached entries.
 * 2. Controlled: pass `logs` (and optionally `loading`) to render entries you
 *    already have — used by the global Activity Feed page.
 *
 * To real-time optimistically update after a mutation, call
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

  const key = `${resourceType}|${resourceId}`;
  const isControlled = controlledLogs !== undefined;
  const logs: ActivityLog[] = isControlled
    ? controlledLogs!
    : (feeds[key] ?? []);
  const loading = isControlled ? !!controlledLoading : storeLoading;

  // Self-fetch mode: trigger a fetch on mount and whenever the entity changes.
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isControlled) return;
    if (lastIdRef.current === resourceId) return;
    lastIdRef.current = resourceId;
    void fetchForEntity(resourceType, resourceId);
  }, [isControlled, resourceType, resourceId, fetchForEntity]);

  const shown = logs.slice(0, maxItems);
  const isLoading = loading && logs.length === 0;

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
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <ol className="relative flex flex-col">
          {/* vertical spine */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[11px] top-2 bottom-2 w-px bg-border"
          />
          {shown.map((log, idx) => (
            <ActivityItem
              key={log._id ?? idx}
              log={log}
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
  showResourceIcon,
  compact,
}: {
  log: ActivityLog;
  showResourceIcon?: boolean;
  compact?: boolean;
}) {
  const { icon, iconColor, bgClass } = resolvePreset(log);
  const text = humanizeActivity(log);
  const ID_RE = /^[a-f\d]{24}$/i;
  const rawWho = log.performerName ?? log.performedBy;
  const who = rawWho && !ID_RE.test(rawWho) ? rawWho : null;
  const when = timeAgo(log.createdAt);
  const fullDate = new Date(log.createdAt).toLocaleString();

  return (
    <li
      className={cn(
        'relative flex items-start gap-3 -mx-2 rounded-lg px-2 transition-colors hover:bg-muted/40',
        compact ? 'py-2' : 'py-3'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border shadow-xs',
                iconColor,
                bgClass
              )}
            >
              {icon}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">{fullDate}</p>
            {who && <p className="text-xs text-muted-foreground">by {who}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="min-w-0 flex-1">
        <ActivityText text={text} />
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {who && <span className="truncate">{who}</span>}
          {who && when && <span aria-hidden>·</span>}
          {when && <span>{when}</span>}
          {showResourceIcon && log.resourceType && (
            <>
              <span aria-hidden>·</span>
              <span className="capitalize">
                {RESOURCE_ICON[log.resourceType] ? (
                  <span className="inline-flex items-center gap-1">
                    {RESOURCE_ICON[log.resourceType]}
                    {log.resourceType}
                  </span>
                ) : (
                  log.resourceType
                )}
              </span>
            </>
          )}
        </div>
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <MetadataChips metadata={log.metadata} />
        )}
        {Array.isArray(log.metadata?.changes) &&
          (log.metadata.changes as string[]).length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {(log.metadata.changes as string[]).map((change, i) => (
                <li key={i}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] leading-none text-muted-foreground">
                    <span
                      aria-hidden
                      className="size-1 rounded-full bg-primary/50"
                    />
                    {summarizeChange(change)}
                  </span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </li>
  );
}

/**
 * Reduce a change description to just its field label, dropping the
 * before/after values (which can contain long HTML like full job
 * descriptions). `Description changed from "<h1>…" to "<h1>…"` becomes
 * `Description changed`.
 */
function summarizeChange(change: string): string {
  const bare = change.replace(/\s+from\s+.*$/s, '').trim();
  return htmlToPlainText(bare);
}

/**
 * Renders an activity description as clean plain text. Strips any HTML,
 * shows a concise summary (with expand/collapse) when the content is long,
 * and preserves list/indent structure via pre-line whitespace.
 */
function ActivityText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const plain = htmlToPlainText(text);
  const { summary, truncated } = summarizeText(plain);
  const [expanded, setExpanded] = useState(false);

  const cls =
    className ?? 'text-sm leading-snug break-words whitespace-pre-line';

  if (!truncated) {
    return <p className={cls}>{plain}</p>;
  }

  return (
    <div>
      <p className={cls}>{expanded ? plain : `${summary}…`}</p>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="mt-0.5 text-xs font-medium text-primary hover:underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

function MetadataChips({ metadata }: { metadata: Record<string, unknown> }) {
  const SKIP_KEYS = new Set([
    '_id',
    'id',
    'resourceId',
    'resourceType',
    'clientId',
    'jobId',
    'candidateId',
    'applicationId',
    'userId',
    'assigneeId',
    'assignedTo',
    'assignedBy',
    'createdBy',
    'updatedBy',
    'tagId',
    'contactId',
    'performerName',
    'performedBy',
    'ownerId',
    'creatorId',
    'emailId',
    'noteId',
    'templateId',
    'pipelineId',
    'stageId',
    // shown inline in the main event text
    'from',
    'to',
    'stageName',
    // already shown elsewhere in the UI
    'reason',
    // rendered as a bullet list in ActivityItem
    'changes',
  ]);
  const ID_RE = /^[a-f\d]{24}$/i;

  const entries = Object.entries(metadata).filter(
    ([k, v]) =>
      !SKIP_KEYS.has(k) &&
      v !== null &&
      v !== undefined &&
      v !== '' &&
      !ID_RE.test(String(v))
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {entries.slice(0, 4).map(([k, v]) => (
        <span
          key={k}
          className="inline-flex min-h-5 items-start gap-1 rounded-md border border-border bg-card px-1.5 py-px text-[11px] text-foreground/80"
        >
          <span className="shrink-0 text-muted-foreground">{k}:</span>
          <span className="break-all">{htmlToPlainText(String(v))}</span>
        </span>
      ))}
    </div>
  );
}
