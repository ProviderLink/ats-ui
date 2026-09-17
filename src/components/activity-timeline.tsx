import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermission } from '@/hooks/use-permission';
import { htmlToPlainText, summarizeText } from '@/lib/html';
import { cn, timeAgo } from '@/lib/utils';
import {
  feedKey,
  useActivityLogStore,
} from '@/store/slices/activity-logs.store';
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
  [ActivityResourceType.eod]: <ClipboardListIcon className="size-4" />,
  [ActivityResourceType.performance_review]: (
    <FileTextIcon className="size-4" />
  ),
  [ActivityResourceType.survey]: <MailIcon className="size-4" />,
  work_entry: <ClipboardListIcon className="size-4" />,
  settings: <ActivityIcon className="size-4" />,
  scorecards: <ClipboardListIcon className="size-4" />,
  vaProfile: <UserIcon className="size-4" />,
  client_account: <Building2Icon className="size-4" />,
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

  // ── Automated events get a specific title. The generic labels ("AI
  //     Validation Completed") repeat verbatim across consecutive rows and
  //     never say _what_ was validated, so name the artefact instead. A
  //     numeric score rides along in the title because it is the one detail
  //     worth reading at a glance. ──────────────────────────────────────
  const score = metadata['score'] ?? metadata['aiScore'];
  const scoreText =
    typeof score === 'number' || typeof score === 'string'
      ? ` — ${score}/100`
      : '';
  if (upper === 'AI_VALIDATION_UPDATED') {
    return metadata['isValid'] === false
      ? `Resume failed validation${scoreText}`
      : `Resume validated${scoreText}`;
  }
  if (upper === 'AI_SCORE_UPDATED') return `AI fit score updated${scoreText}`;
  if (upper === 'PARSED_DATA_UPDATED' || upper === 'RESUME_PARSING_COMPLETED') {
    return 'Resume parsed';
  }

  // ── A bare "Updated" says nothing. Name the thing that changed so the row
  //     reads as a sentence on its own ("Candidate updated" + `Email`). ──
  if (upper === 'UPDATED' && log.resourceType) {
    const subject =
      log.resourceType === 'candidate' ? 'Candidate profile' : resType;
    return `${subject} updated`;
  }

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

/** Extra entries revealed per "Show more" click once the local render window
 * (`maxItems`) is exceeded. Mirrors the store's server page size. */
const MAX_ITEMS_STEP = 50;

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
  /** Render even when the current user lacks `activityLogs:read`. Only set
   * this for contexts that already gate access themselves. */
  bypassPermissionCheck?: boolean;
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
  bypassPermissionCheck = false,
}: ActivityTimelineProps) {
  const { hasPermission } = usePermission();
  const canRead = hasPermission('activityLogs', 'read');

  const feeds = useActivityLogStore(s => s.feeds);
  const feedLoading = useActivityLogStore(s => s.loading);
  const feedErrors = useActivityLogStore(s => s.errors);
  const feedPagination = useActivityLogStore(s => s.pagination);
  const fetchForEntity = useActivityLogStore(s => s.fetchForEntity);
  const fetchMore = useActivityLogStore(s => s.fetchMore);

  // Local render window — grows when the user reveals already-fetched entries
  // that exceeded `maxItems`, independently of server-side paging.
  const [renderLimit, setRenderLimit] = useState(maxItems);

  const key = feedKey(resourceType, resourceId);
  const isControlled = controlledLogs !== undefined;
  const logs: ActivityLog[] = isControlled
    ? controlledLogs!
    : (feeds[key] ?? []);
  const loading = isControlled ? !!controlledLoading : !!feedLoading[key];
  const error = isControlled ? null : (feedErrors[key] ?? null);
  const pagination = isControlled ? null : (feedPagination[key] ?? null);

  // Self-fetch mode: fetch on mount and whenever the entity changes.
  // Always forces a refresh: any cached entries render immediately (so there
  // is no blank flash), while the request revalidates them in the background.
  // Otherwise a feed persisted from an earlier session would never update.
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isControlled) return;
    if (!canRead) return;
    if (lastIdRef.current === resourceId) return;
    lastIdRef.current = resourceId;
    // Reset the render window so a previously expanded feed does not leak into
    // the next entity rendered by this same component instance.
    setRenderLimit(maxItems);
    void fetchForEntity(resourceType, resourceId, { force: true });
  }, [
    isControlled,
    canRead,
    resourceType,
    resourceId,
    maxItems,
    fetchForEntity,
  ]);

  // Roles without `activityLogs:read` would otherwise see an empty feed, which
  // is indistinguishable from a genuinely empty history. Render nothing.
  if (!bypassPermissionCheck && !canRead) return null;

  const shown = logs.slice(0, renderLimit);
  const isLoading = loading && logs.length === 0;
  // `hasMore` means the server holds entries we have not fetched yet (another
  // page), while `isTruncated` is the local render cap. Both need a control.
  const hasMore = !!pagination && pagination.page < pagination.totalPages;
  const isTruncated = shown.length < logs.length;
  const canShowMore = !isControlled && (hasMore || isTruncated);

  const handleShowMore = () => {
    if (isTruncated && !hasMore) {
      setRenderLimit(prev => prev + MAX_ITEMS_STEP);
      return;
    }
    void fetchMore(resourceType, resourceId);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {heading && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{heading}</h4>
          {logs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {pagination && pagination.total > logs.length
                ? `${logs.length} of ${pagination.total} entries`
                : `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`}
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
      ) : error && logs.length === 0 ? (
        // A failed fetch previously rendered as "No activity yet.", which hid
        // permission and network errors behind a misleading empty state.
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 py-8 text-center">
          <AlertCircleIcon className="size-5 text-destructive/60" />
          <p className="text-xs text-muted-foreground">
            Could not load activity.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={loading}
            onClick={() => {
              lastIdRef.current = resourceId;
              void fetchForEntity(resourceType, resourceId, { force: true });
            }}
          >
            {loading ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <ActivityIcon className="size-5 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <div className="relative flex flex-col">
          {/* vertical spine */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[11px] top-3 bottom-3 w-px bg-border"
          />
          {groupByDay(shown).map(group => (
            <section key={group.label} className="flex flex-col">
              {/* Date separator. Rows below no longer repeat a relative
                  timestamp, so this is the single place a date appears and the
                  eye can jump straight to the day it wants. */}
              <div className="relative z-10 flex items-center gap-2 pb-1.5 pt-3 first:pt-0">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </span>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </div>
              <div role="list" className="flex flex-col">
                {group.items.map((log, idx) => (
                  <ActivityItem
                    key={log._id ?? idx}
                    log={log}
                    showResourceIcon={showResourceIcon}
                    compact={compact}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {canShowMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-fit self-center px-3 text-xs"
          disabled={loading}
          onClick={handleShowMore}
        >
          {loading
            ? 'Loading…'
            : `Load older activity${
                pagination && hasMore
                  ? ` (${pagination.total - logs.length} more)`
                  : ''
              }`}
        </Button>
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
  const who = resolvePerformer(log);
  const when = timeAgo(log.createdAt);
  const fullDate = new Date(log.createdAt).toLocaleString();
  const details = describeMetadata(log);

  return (
    <li
      className={cn(
        'group relative flex items-start gap-3 -mx-2 rounded-lg px-2 transition-colors hover:bg-muted/40',
        compact ? 'py-1.5' : 'py-2.5'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border shadow-xs',
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

        {/* Attribute line: who + when, kept visually quiet so the action
            sentence stays the primary signal. */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          {who && <span className="max-w-45 truncate font-medium">{who}</span>}
          {who && when && <span aria-hidden>·</span>}
          {when && <span title={fullDate}>{when}</span>}
          {showResourceIcon && log.resourceType && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 capitalize">
                {RESOURCE_ICON[log.resourceType] ?? null}
                {log.resourceType}
              </span>
            </>
          )}
        </div>

        {details.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap items-center gap-1">
            {details.map((d, i) => (
              <li
                key={i}
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] leading-tight"
              >
                {d.label && (
                  <span className="shrink-0 text-muted-foreground/70">
                    {d.label}
                  </span>
                )}
                <span className="truncate text-foreground/80">{d.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Resolve the human performer name, or `null` when there is nobody to show.
 * A bare ObjectId means the user record is gone — we show no name rather than
 * a hex string, since an id is meaningless to a reader.
 */
function resolvePerformer(log: ActivityLog): string | null {
  const raw = log.performerName ?? log.performedBy;
  if (!raw) return null;
  if (/^[a-f\d]{24}$/i.test(raw)) return null;
  return raw;
}

/** A single detail token rendered under an activity row. */
interface DetailToken {
  label: string;
  value?: string;
}

/**
 * Metadata keys that ARE worth showing, mapped to a human label.
 *
 * This is deliberately an ALLOWLIST. The previous implementation used a
 * skip-list, so every machine field the backend happened to add (`provider:
 * openai`, `skillsCount: 25`, `sections: [...]`, `status: pending`) leaked
 * into the UI as noise. Anything not named here is now simply never shown, so
 * a new backend field can never clutter the feed again.
 */
const METADATA_LABELS: Record<string, string> = {
  // Stage / status transitions (rendered as an arrow, not as a field chip).
  from: 'from',
  fromStage: 'from',
  fromStageName: 'from',
  stageName: 'from',
  oldStatus: 'from',
  to: 'to',
  toStage: 'to',
  toStageName: 'to',
  newStatus: 'to',
  destination: 'to',
  // Genuinely useful context.
  reasonLabel: 'Reason',
  interviewType: 'Interview',
  scheduledAt: 'Scheduled for',
  rating: 'Rating',
  companyName: 'Company',
  industry: 'Industry',
  weekStart: 'Week of',
  generated: 'Generated',
};

/**
 * Keys whose ONLY sane rendering is as a before → after arrow. Rendering them
 * as separate `From:` / `To:` chips duplicates the verb in the sentence above
 * ("Candidate Status Changed" + "From: pending" + "To: approved").
 */
const TRANSITION_KEYS = [
  ['from', 'to'],
  ['fromStage', 'toStage'],
  ['fromStageName', 'toStageName'],
  ['oldStatus', 'newStatus'],
  ['stageName', 'toStageName'],
] as const;

/** Machine bookkeeping — never meaningful to a reader. */
const INTERNAL_KEYS = new Set([
  'provider',
  'sections',
  'skillsCount',
  'experienceCount',
  'educationCount',
  'isValid',
  'changes',
  'reason', // AI prose, routinely 200+ characters — shown via description instead
  'notes',
  'internalNotes',
  'status',
  'phase',
  'appliedJobId',
  'jobId',
  'candidateId',
  'resourceId',
  'resourceType',
  'stageId',
  'type',
  'score', // only meaningful alongside an AI event; the title carries it
]);

/** How a candidate/job/client arrived, phrased as plain language. */
const SOURCE_PHRASES: Record<string, string> = {
  applied: 'Applied directly',
  direct_apply: 'Applied directly',
  assigned: 'Assigned by staff',
  internal_upload: 'Uploaded by staff',
  manual: 'Added manually',
};

/** Values that are just snake_case tokens → readable words. */
function humanizeValue(value: unknown): string {
  const s = htmlToPlainText(String(value));
  return s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

/** `good_fit` → `Good fit`; used for enum-ish values. */
function humanizeEnum(value: unknown): string {
  const s = humanizeValue(value);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Format an ISO timestamp as a short local date/time; pass through anything
 * that is not a date so enum-ish values are unaffected. */
function humanizeDetailValue(value: unknown): string {
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  return humanizeEnum(value);
}

/**
 * Reduce a `changes` entry to just the field it touched.
 *
 * The raw values carry before/after payloads that can include entire HTML job
 * descriptions, so only the field name is kept: `Description changed from
 * "<h1>…" to "<h1>…"` becomes `Description`. The row title already says
 * "updated", so repeating "changed" on every chip is pure noise.
 */
function changeFieldLabel(change: string): string {
  const raw = htmlToPlainText(String(change)).replace(/\s+/g, ' ').trim();
  return humanizeEnum(
    raw.replace(/\s+(changed|updated|set|removed|added)\b.*$/i, '').trim()
  );
}

/**
 * Build the detail tokens for a row.
 *
 * Guarantees, in order of importance for readability:
 *   - `changes` diffs (the most informative thing on an update) are shown
 *     first, but long before/after payloads are trimmed to the field name.
 *   - before → after pairs collapse into ONE token instead of two.
 *   - `source` is phrased in plain language.
 *   - long prose (`reason`) and machine fields are never shown.
 *
 * Returns an empty array when nothing is worth showing, so a row can be a
 * single clean sentence.
 */
function describeMetadata(log: ActivityLog): DetailToken[] {
  const metadata = log.metadata ?? {};
  const tokens: DetailToken[] = [];
  const consumed = new Set<string>();

  // ── 1. before → after transitions ────────────────────────────────
  for (const [fromKey, toKey] of TRANSITION_KEYS) {
    const from = metadata[fromKey];
    const to = metadata[toKey];
    if (to === undefined || to === null || to === '') continue;
    if (typeof to === 'object') continue;
    if (consumed.has(toKey) || consumed.has(fromKey)) continue;

    consumed.add(toKey);
    if (from !== undefined && from !== null && from !== '')
      consumed.add(fromKey);

    const toText = humanizeEnum(to);
    const fromText =
      from !== undefined && from !== null && from !== ''
        ? humanizeEnum(from)
        : null;

    // Only show the arrow when there is a genuine before AND after.
    tokens.push({
      label: '',
      value:
        fromText && fromText !== toText ? `${fromText} → ${toText}` : toText,
    });
  }

  // ── 2. Source, phrased ───────────────────────────────────────────
  const source = metadata['source'];
  if (typeof source === 'string' && source) {
    const phrase = SOURCE_PHRASES[source] ?? humanizeEnum(source);
    tokens.push({ label: '', value: phrase });
  }

  // ── 3. Field-level diffs from an update ──────────────────────────
  //    A change like `Description changed from "<h1>…" to "<h1>…"` carries the
  //    whole payload in its text, so only the affected field name is kept —
  //    that is what a reader wants ("what was touched"), and it stays short
  //    no matter how large the before/after value was.
  const changes = metadata['changes'];
  if (Array.isArray(changes)) {
    for (const c of changes.slice(0, 5)) {
      const field = changeFieldLabel(String(c));
      if (!field) continue;
      tokens.push({ label: '', value: field });
    }
  }

  // ── 4. Remaining allowlisted values ──────────────────────────────
  for (const [key, raw] of Object.entries(metadata)) {
    if (tokens.length >= 6) break;
    if (consumed.has(key) || INTERNAL_KEYS.has(key)) continue;
    const label = METADATA_LABELS[key];
    if (!label) continue;
    if (raw === null || raw === undefined || raw === '') continue;
    if (typeof raw === 'object') continue;
    if (/^[a-f\d]{24}$/i.test(String(raw))) continue;

    const text = humanizeDetailValue(raw);
    if (!text) continue;
    tokens.push({ label: `${label}:`, value: text });
  }

  return tokens;
}

/**
 * Group entries into day buckets, newest first.
 *
 * Returned in input order, which the API already sorts newest-first, so the
 * caller does not need to re-sort.
 */
function groupByDay(
  logs: ActivityLog[]
): { label: string; items: ActivityLog[] }[] {
  const groups: { label: string; items: ActivityLog[] }[] = [];
  let current: { label: string; items: ActivityLog[] } | null = null;

  for (const log of logs) {
    const label = dayLabel(log.createdAt);
    if (!current || current.label !== label) {
      current = { label, items: [] };
      groups.push(current);
    }
    current.items.push(log);
  }
  return groups;
}

/** `Today` / `Yesterday` / `12 Sep 2026` for a timestamp. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown date';

  const midnight = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(new Date()) - midnight(d)) / 86_400_000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
