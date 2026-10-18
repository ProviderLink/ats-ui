import type { ActivityIconName } from '@/lib/activity-actions';
import type { ActivityTone } from '@/lib/activity-sentence';
import {
  ActivityResourceType,
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
import { type ReactNode } from 'react';

/**
 * Ink colour per semantic tone. Only the glyph that stands in for a missing
 * performer uses it — the sentences themselves stay in foreground ink so a long
 * feed reads as plain prose rather than a wall of coloured labels.
 */
export const TONE_ACCENT: Record<ActivityTone, string> = {
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
export const ACTIVITY_ICON: Record<ActivityIconName, LucideIcon> = {
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

export const RESOURCE_ICON: Record<ActivityResourceTypeValue | string, ReactNode> = {
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
