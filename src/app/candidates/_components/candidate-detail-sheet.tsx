import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ActivityTimeline } from '@/components/activity-timeline';
import { ChangeJobDialog } from '@/components/change-job-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PortfolioSection } from '@/components/portfolio-section';
import { RejectDialog, type RejectPayload } from '@/components/reject-dialog';
import { RestoreCandidateDialog } from '@/components/restore-candidate-dialog';
import { ResumeViewer } from '@/components/resume-viewer';
import { ScheduleInterviewDialog } from '@/components/schedule-interview-dialog';
import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { logOptimisticActivity } from '@/lib/activity';
import { getJson, patchJson } from '@/lib/api-client';
import { getTagIds } from '@/lib/tags';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useAuthStore } from '@/store/slices/auth.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useClientStore } from '@/store/slices/clients.store';
import { useEmailTemplateStore } from '@/store/slices/email-templates.store';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import { useUserStore } from '@/store/slices/users.store';
import type { InterviewScorecard } from '@/store/types/interview-scorecard.types';
// Interview Scorecard UI — sibling components in this folder.
import type {
  Application,
  Candidate,
  EmailTemplate,
  Interview,
  InterviewMeetingType,
  InterviewRecommendation,
  ParsedEducation,
  ParsedExperience,
} from '@/store/types';
import { INTERVIEW_MEETING_TYPE_LABELS } from '@/store/types';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightLeftIcon,
  BanIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  GitCommitHorizontalIcon,
  GraduationCapIcon,
  Loader2Icon,
  MailIcon,
  MapPinIcon,
  MoveRightIcon,
  PencilIcon,
  PhoneIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
  UserCheckIcon,
  VideoIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  avatarBg,
  getFitConfig,
  phaseConfig,
  scoreBarColor,
  scoreTextColor,
} from '../_utils/candidate-styles';
import { InterviewScorecardForm } from './interview-scorecard-form';
import { InterviewScorecardHistory } from './interview-scorecard-history';

/** Substitute `{{var}}` placeholders in template strings with values. */
function substituteTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}

/** Default subject line when no email template is configured. */
function defaultSubject(
  type: 'offer' | 'rejection' | 'general' | 'follow_up'
): string {
  switch (type) {
    case 'offer':
      return 'Offer from our team';
    case 'rejection':
      return 'Update on your application';
    case 'follow_up':
      return 'Following up on your application';
    default:
      return '';
  }
}

function TalentPoolNotesEditor({
  notes,
  mutating,
  onSave,
}: {
  notes: string;
  mutating: boolean;
  onSave: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <Textarea
          rows={4}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="resize-none text-sm"
          placeholder="Add a note about this candidate…"
          disabled={mutating}
        />
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setEditing(false);
              setDraft(notes);
            }}
            disabled={mutating}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className="h-7 text-xs"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            disabled={mutating}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {notes.trim() ? (
        <p className="text-sm text-muted-foreground leading-relaxed italic whitespace-pre-wrap pr-6">
          "{notes}"
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">
          No notes added
        </p>
      )}
      <Button
        variant="outline"
        size="icon-xs"
        className="absolute top-0 right-0 bg-background/60 backdrop-blur-sm hover:bg-background/80"
        onClick={() => {
          setDraft(notes);
          setEditing(true);
        }}
        title="Edit notes"
      >
        <PencilIcon className="size-3.5" />
      </Button>
    </div>
  );
}

function IntroVideo({
  url,
  source,
}: {
  url: string;
  source?: 'cloudinary' | 'external' | null;
}) {
  const isCloudinary = source === 'cloudinary' || url.includes('cloudinary');
  return (
    <div className="flex flex-col gap-2 h-96">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <VideoIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Intro Video</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="size-3.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      {isCloudinary ? (
        <div className="flex-1 rounded-lg border bg-black overflow-hidden">
          <video src={url} controls className="size-full" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 p-4 text-center">
          <PlayIcon className="size-8 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            External video link — please open the link below to watch the
            candidate&apos;s intro video.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open video
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function InterviewCompleteFeedbackForm({
  interviewId,
  onComplete,
  onReschedule,
  onCancel,
}: {
  interviewId: string;
  onComplete: (
    id: string,
    data: {
      rating: number;
      notes: string;
      recommendation: InterviewRecommendation;
    }
  ) => Promise<void>;
  onReschedule: () => void;
  onCancel: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'buttons' | 'feedback'>('buttons');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] =
    useState<InterviewRecommendation>('yes');
  const [submitting, setSubmitting] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (mode === 'feedback') {
    return (
      <div className="rounded-md border p-3 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Complete & Feedback
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 text-[10px] px-1.5 text-muted-foreground"
            onClick={() => setMode('buttons')}
          >
            Cancel
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">
            Rating
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="text-sm"
              >
                <StarIcon
                  className={cn(
                    'size-4',
                    i <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">
            Decision
          </span>
          <Select
            value={recommendation}
            onValueChange={setRecommendation as (v: string) => void}
          >
            <SelectTrigger className="h-7 text-[10px] flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strong_yes">Strong Yes</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="strong_no">Strong No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Feedback notes…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-xs h-16 resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-7 text-[11px] px-3"
            disabled={!rating || submitting}
            onClick={async () => {
              setSubmitting(true);
              try {
                await onComplete(interviewId, {
                  rating,
                  notes,
                  recommendation,
                });
                setRating(0);
                setNotes('');
                setMode('buttons');
              } catch {
                // toast handled by store
                setMode('buttons');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting && <Loader2Icon className="size-3 mr-1 animate-spin" />}
            Submit & Complete
          </Button>
        </div>
      </div>
    );
  }

  if (cancelConfirm) {
    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Button
          size="sm"
          variant="destructive"
          className="h-6 text-[10px] px-2"
          onClick={async () => {
            setCancelConfirm(false);
            await onCancel(interviewId);
          }}
        >
          Confirm Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-2"
          onClick={() => setCancelConfirm(false)}
        >
          Keep
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 mt-1 flex-wrap">
      <Button
        size="sm"
        className="h-7 text-[11px] px-2.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => setMode('feedback')}
      >
        <CheckCircle2Icon className="size-3.5" />
        Complete & Feedback
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[11px] px-2.5 gap-1.5"
        onClick={onReschedule}
      >
        <CalendarIcon className="size-3.5" />
        Reschedule
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-[11px] px-2.5 gap-1.5 text-muted-foreground hover:text-destructive"
        onClick={() => setCancelConfirm(true)}
      >
        <XCircleIcon className="size-3.5" />
        Cancel
      </Button>
    </div>
  );
}

function RescheduleDialog({
  open,
  onClose,
  onConfirm,
  interviewTitle,
  currentDate,
  currentDuration,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { scheduledAt: string; duration: number }) => Promise<void>;
  interviewTitle: string;
  currentDate: string;
  currentDuration: number;
  loading?: boolean;
}) {
  // Only mounted while open, so the form below is seeded from initial state
  // and needs no reset effect. The key re-seeds it if the interview changes.
  if (!open) return null;
  return (
    <RescheduleForm
      key={`${interviewTitle}:${currentDate}`}
      onClose={onClose}
      onConfirm={onConfirm}
      interviewTitle={interviewTitle}
      currentDate={currentDate}
      currentDuration={currentDuration}
      loading={loading}
    />
  );
}

function RescheduleForm({
  onClose,
  onConfirm,
  interviewTitle,
  currentDate,
  currentDuration,
  loading,
}: {
  onClose: () => void;
  onConfirm: (data: { scheduledAt: string; duration: number }) => Promise<void>;
  interviewTitle: string;
  currentDate: string;
  currentDuration: number;
  loading?: boolean;
}) {
  const initial = useMemo(() => {
    const d = new Date(currentDate);
    return {
      date: d.toISOString().slice(0, 10),
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    };
  }, [currentDate]);

  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [duration, setDuration] = useState(currentDuration);

  const isValid = date && time && duration > 0;

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Reschedule Interview</DialogTitle>
          <DialogDescription className="text-xs">
            {interviewTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Time</Label>
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Duration (min)</Label>
            <Select
              value={String(duration)}
              onValueChange={v => setDuration(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90, 120].map(m => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!isValid || loading}
            onClick={async () => {
              if (!isValid) return;
              await onConfirm({
                scheduledAt: new Date(`${date}T${time}`).toISOString(),
                duration,
              });
            }}
          >
            {loading ? 'Saving…' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PipelineProgressBar({
  stages,
  currentStageId,
}: {
  stages: { _id: string; name: string; color: string }[];
  currentStageId?: string | null;
}) {
  if (stages.length === 0) return null;
  const currentIdx = currentStageId
    ? stages.findIndex(s => s._id === currentStageId)
    : -1;
  const progressPct =
    currentIdx >= 0 ? Math.round((currentIdx / (stages.length - 1)) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground shrink-0 tabular-nums">
          {currentIdx >= 0 ? currentIdx + 1 : 0}/{stages.length}
        </span>
      </div>

      {/* Stage circles + arrows + labels */}
      <div className="flex items-start overflow-x-auto pb-1">
        {stages.map((s, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const isLast = i === stages.length - 1;
          return (
            <div key={s._id} className="flex items-start shrink-0">
              {/* Stage column: circle + label */}
              <div className="flex flex-col items-center w-16 shrink-0">
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-300',
                    isCompleted &&
                      'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25',
                    isCurrent && 'text-white shadow-md',
                    isFuture &&
                      'bg-muted text-muted-foreground border-2 border-border'
                  )}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: s.color,
                          boxShadow: `0 0 0 3px ${s.color}20`,
                        }
                      : undefined
                  }
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] text-center leading-snug mt-1.5',
                    isFuture
                      ? 'text-muted-foreground'
                      : 'font-semibold text-foreground'
                  )}
                >
                  {s.name}
                </span>
              </div>
              {/* Arrow between stages, aligned with circle center */}
              {!isLast && (
                <div
                  className="flex items-center shrink-0 w-6"
                  style={{ height: 24 }}
                >
                  <MoveRightIcon
                    className={cn(
                      'size-4 transition-colors duration-300',
                      i < currentIdx
                        ? 'text-emerald-500'
                        : isCurrent
                          ? 'text-emerald-400/50'
                          : 'text-muted-foreground/30'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

const PROFICIENCY_STYLE: Record<string, string> = {
  basic:
    'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  conversational:
    'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300',
  professional:
    'border-green-300 text-green-700 dark:border-green-600 dark:text-green-300',
  fluent:
    'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300',
  native:
    'border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300',
};

const PROFICIENCY_LABEL: Record<string, string> = {
  basic: 'Basic',
  conversational: 'Conversational',
  professional: 'Professional Working',
  fluent: 'Fluent',
  native: 'Native / Bilingual',
};

function EnglishProficiencyBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        PROFICIENCY_STYLE[level] ?? ''
      )}
    >
      {PROFICIENCY_LABEL[level] ?? level}
    </span>
  );
}

function ExperienceTimeline({ items }: { items: ParsedExperience[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No experience listed.</p>
    );
  return (
    <div className="flex flex-col">
      {items.map((exp, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-pine-teal-600 dark:bg-pine-teal-400" />
            {i < items.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div
            className={cn('min-w-0', i < items.length - 1 ? 'pb-5' : 'pb-1')}
          >
            <p className="text-sm font-medium leading-tight">{exp.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {exp.company} · {exp.duration}
            </p>
            {exp.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {exp.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationList({ items }: { items: ParsedEducation[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No education listed.</p>
    );
  return (
    <div className="flex flex-col gap-3">
      {items.map((edu, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <GraduationCapIcon className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {edu.degree} in {edu.field}
            </p>
            <p className="text-xs text-muted-foreground">
              {edu.institution} · {edu.year}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TalentPoolDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Talent Pool</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Notes (optional)</Label>
          <Textarea
            rows={3}
            placeholder="e.g. Available in 3 months. Prefers remote."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(notes);
              onClose();
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignJobDialog({
  open,
  onClose,
  onConfirm,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string) => void;
  jobs: { _id: string; title: string }[];
}) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q));
  }, [jobs, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to a new job</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No jobs found
              </p>
            ) : (
              <div className="flex flex-col">
                {filtered.map(j => (
                  <button
                    key={j._id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                      selected === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => setSelected(j._id)}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full border flex items-center justify-center shrink-0',
                        selected === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selected === j._id && <CheckIcon className="size-3" />}
                    </span>
                    {j.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onConfirm(selected);
              setSelected('');
              setSearch('');
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationCard({
  app,
  jobTitle,
  clientName,
  stages,
  approverName,
}: {
  app: Application;
  jobTitle: string;
  clientName: string;
  stages?: { _id: string; name: string; color: string }[];
  approverName?: string;
}) {
  const { label, cls } = phaseConfig[app.phase];
  const sourceLabel =
    {
      direct_apply: 'Direct Apply',
      internal_upload: 'Uploaded',
      assigned: 'Assigned',
    }[app.source] ?? app.source;

  const isRejected = app.phase === 'rejected';
  const isHired = app.phase === 'hired';
  const isPending = app.phase === 'pending';
  const isApproved = app.phase === 'approved';
  const hasPipeline = isApproved && stages && stages.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border px-4 py-3.5',
        isRejected &&
          'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
        isHired &&
          'border-emerald-300/60 bg-emerald-50/30 dark:border-emerald-700/30 dark:bg-emerald-950/20'
      )}
    >
      {/* Header row: job title + phase badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{jobTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
        </div>
        <Badge className={cn('h-5.5 shrink-0 px-2 text-xs font-medium', cls)}>
          {label}
        </Badge>
      </div>

      {/* Metadata row: source, stage, applied date */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BriefcaseIcon className="size-3" />
          {sourceLabel}
        </span>
        {app.currentStage && (
          <span className="inline-flex items-center gap-1">
            <GitCommitHorizontalIcon className="size-3" />
            {app.currentStage.stageName}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1"
          title={formatDate(app.appliedAt)}
        >
          <ClockIcon className="size-3" />
          {isPending ? (
            <span className="text-amber-600 dark:text-amber-400">
              {timeAgo(app.appliedAt)}
            </span>
          ) : (
            timeAgo(app.appliedAt)
          )}
        </span>
      </div>

      {/* Pipeline progress — approved apps only */}
      {hasPipeline && (
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-700/40 bg-linear-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/30 dark:to-transparent p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <GitCommitHorizontalIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Pipeline
            </span>
          </div>
          <PipelineProgressBar
            stages={stages!}
            currentStageId={app.currentStage?.stageId ?? null}
          />
        </div>
      )}

      {/* Pipeline metadata — approved apps only */}
      {isApproved && (app.approvedAt || approverName || app.notes) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {app.approvedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-900/30 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2Icon className="size-3" />
              <span className="font-medium">{formatDate(app.approvedAt)}</span>
            </span>
          )}
          {approverName && (
            <span className="text-muted-foreground">
              by{' '}
              <span className="font-medium text-foreground">
                {approverName}
              </span>
            </span>
          )}
          {app.notes && (
            <span className="w-full text-muted-foreground leading-relaxed mt-0.5 italic text-xs">
              "{app.notes}"
            </span>
          )}
        </div>
      )}

      {/* AI Validation — compact row */}
      {app.aiValidation && (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-xs">
          {app.aiValidation.isValid ? (
            <CheckCircle2Icon className="size-3.5 mt-px shrink-0 text-emerald-600" />
          ) : (
            <XCircleIcon className="size-3.5 mt-px shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <span className="text-muted-foreground">
              AI Validation · Score{' '}
              <span className="font-medium text-foreground">
                {app.aiValidation.score}
              </span>
            </span>
            {app.aiValidation.reason && (
              <span className="text-muted-foreground">
                {' '}
                — {app.aiValidation.reason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {isRejected && (
        <div className="flex flex-col gap-0.5 rounded-md bg-destructive/8 px-2.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-destructive">
            <BanIcon className="size-3" />
            Rejected
            {app.rejectedAt && (
              <span className="font-normal text-muted-foreground">
                · {formatDate(app.rejectedAt)}
              </span>
            )}
          </div>
          {app.rejectionReason && (
            <p className="text-muted-foreground">{app.rejectionReason}</p>
          )}
        </div>
      )}

      {/* Hired banner */}
      {isHired && app.hiredAt && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-100/60 px-2.5 py-2 text-xs dark:bg-emerald-900/20">
          <UserCheckIcon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            Hired
          </span>
          <span className="text-muted-foreground">
            · {formatDate(app.hiredAt)}
          </span>
        </div>
      )}

      {/* Activity trail — collapsible, hidden for untouched pending apps */}
      {!isPending && (
        <details className="group rounded-md border bg-muted/30">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRightIcon className="size-3 transition-transform group-open:rotate-90" />
            Activity log
          </summary>
          <div className="px-3 pb-3">
            <ActivityTimeline
              resourceType="application"
              resourceId={app._id}
              compact
            />
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * PendingActionsToolbar
 *
 * Sticky footer action bar shown when a candidate is in the pending stage.
 *
 * Every action is one click — no dropdowns / selects. Approve is the only
 * filled (primary) button to mark the default/expected path; combined Approve
 * variants share its emerald colour so they read as a single cluster. The two
 * "neutral" supporting actions (Email, Add to Talent Pool) sit between, and
 * Reject variants are kept visually quiet with a destructive outline.
 *
 * The component is pure: each button merely emits its intent via the matching
 * callback — the parent owns confirmation flows and side-effects.
 *
 *   [ Approve ] [ Approve & Email ] [ Approve, Email & Talent Pool ]
 *     [ Email ]   [ Add to Talent Pool ]
 *   [ Reject & Email ] [ Reject ]
 */
function PendingActionsToolbar({
  onApprove,
  onApproveAndEmail,
  onApproveEmailAndPool,
  onReject,
  onRejectAndEmail,
  onEmail,
  onAddToTalentPool,
  disabled,
}: {
  onApprove: () => void;
  onApproveAndEmail: () => void;
  onApproveEmailAndPool: () => void;
  onReject: () => void;
  onRejectAndEmail: () => void;
  onEmail: () => void;
  onAddToTalentPool: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {/* Approve cluster — emerald outline */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApprove}
      >
        <CheckIcon className="size-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApproveAndEmail}
      >
        <CheckIcon className="size-3.5" />
        <MailIcon className="size-3" />
        Approve &amp; Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        onClick={onApproveEmailAndPool}
      >
        <CheckIcon className="size-3.5" />
        <MailIcon className="size-3" />
        <StarIcon className="size-3" />
        Approve, Email &amp; Talent Pool
      </Button>

      {/* Supporting actions — neutral */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onEmail}
      >
        <MailIcon className="size-3.5" />
        Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onAddToTalentPool}
      >
        <StarIcon className="size-3.5" />
        Add to Talent Pool
      </Button>

      {/* Reject cluster — destructive outline */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        onClick={onRejectAndEmail}
      >
        <XIcon className="size-3.5" />
        <MailIcon className="size-3" />
        Reject &amp; Email
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        onClick={onReject}
      >
        <XIcon className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}

type Props = {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mutating?: boolean;
  hideAiScore?: boolean;
};

/**
 * IneligibleActions
 *
 * Footer bar for a permanently ineligible candidate. This state has no pipeline
 * and no application, so the pending/approved/hired toolbars do not apply — the
 * only two things an admin can do here are restore them (which clears
 * ineligibility and lands them in In Review for a chosen job) or delete them
 * outright, the single permanent-delete path in the ATS.
 */
function IneligibleActions({
  legalHold,
  onToggleLegalHold,
  onRestore,
  onDelete,
  disabled,
}: {
  legalHold: boolean;
  onToggleLegalHold: () => void;
  onRestore: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onToggleLegalHold}
      >
        {legalHold ? (
          <ShieldOffIcon className="size-3.5" />
        ) : (
          <ShieldAlertIcon className="size-3.5" />
        )}
        {legalHold ? 'Remove Legal Hold' : 'Place Legal Hold'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5"
        onClick={onRestore}
      >
        <ShieldOffIcon className="size-3.5" />
        Restore
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
        onClick={onDelete}
      >
        <Trash2Icon className="size-3.5" />
        Delete Permanently
      </Button>
    </div>
  );
}

/**
 * Small inline button for provisioning/revoking CRM access on a hired candidate.
 */
function CandidateCrmButton({
  candidateId,
  candidateStatus,
}: {
  candidateId: string;
  candidateStatus: string;
}) {
  const { provisionVA } = useUserStore();
  const allUsers = useUserStore(s => s.items);
  const [busy, setBusy] = useState(false);

  if (candidateStatus !== 'hired') return null;

  const crmUser = allUsers.find(
    u => u.candidateRef === candidateId && u.appAccess?.includes('crm')
  );
  const hasCrmAccess = !!crmUser;

  async function handleProvision() {
    setBusy(true);
    try {
      await provisionVA(candidateId);
      toast.success('VA provisioned. Invite email will be sent.');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to provision VA');
    } finally {
      setBusy(false);
    }
  }

  if (hasCrmAccess) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pine-teal-500/40 bg-pine-teal-50 px-2 py-0.5 text-[11px] font-medium text-pine-teal-700 dark:bg-pine-teal-950/50 dark:text-pine-teal-400">
        <ShieldCheckIcon className="size-3" />
        CRM Active
        {!crmUser?.isInviteAccepted && (
          <span className="text-amber-600 dark:text-amber-400">(invited)</span>
        )}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 gap-1 px-2 text-xs"
      onClick={handleProvision}
      disabled={busy}
      title="Send CRM portal invite to this VA"
    >
      <ShieldCheckIcon className="size-3 text-muted-foreground" />
      {busy ? '…' : 'Give CRM Portal Access'}
    </Button>
  );
}

/**
 * Candidate transition history.
 *
 * Rejections and job changes are logged against the application (with the
 * candidate as `relatedType`/`relatedId`), while talent pool and eligibility
 * changes are logged against the candidate. This panel asks the API for both —
 * `includeRelated=true` adds entries that merely reference the candidate — so
 * the whole journey appears in one place.
 *
 * `disposition` is deliberately absent: it duplicates the application-level
 * `rejected` entry, which already carries the destination and reason.
 * Secondary rows that a reject writes as side effects (the talent-pool and
 * eligibility flips) are collapsed below, so one action reads as one entry.
 */
const TRANSITION_ACTIONS = new Set([
  'rejected',
  'job_changed',
  'eligibility_changed',
  'talent_pool_added',
  'talent_pool_removed',
  'hired',
]);

/** Actions a reject performs as a side effect rather than by user choice. */
const REJECT_SIDE_EFFECTS = new Set([
  'talent_pool_added',
  'talent_pool_removed',
  'eligibility_changed',
]);

/**
 * Collapse the rows a single operation writes.
 *
 * A final reject writes an application-level `rejected` row plus candidate-level
 * talent-pool / eligibility rows, all at the same instant. Keep the primary row
 * and drop the side effects that share its second, so the log is not padded with
 * one click appearing three times. A genuine standalone talent-pool change
 * happens at a different time and is therefore preserved.
 */
function collapseSideEffects<T extends { action: string; createdAt: string }>(
  entries: T[]
): T[] {
  const primarySeconds = new Set(
    entries
      .filter(e => !REJECT_SIDE_EFFECTS.has(e.action))
      .map(e => Math.floor(new Date(e.createdAt).getTime() / 1000))
  );
  return entries.filter(e => {
    if (!REJECT_SIDE_EFFECTS.has(e.action)) return true;
    return !primarySeconds.has(
      Math.floor(new Date(e.createdAt).getTime() / 1000)
    );
  });
}

function RejectionHistory({
  candidateId,
  refreshKey,
}: {
  candidateId: string;
  /** Changes after an in-sheet action so the list re-fetches. */
  refreshKey?: string;
}) {
  interface TransitionEntry {
    _id: string;
    action: string;
    createdAt: string;
    performedBy?: string | null;
    relatedId?: string | null;
    resourceType?: string | null;
    metadata?: Record<string, unknown>;
  }
  // `null` means not loaded yet. The effect only sets state from the async
  // callbacks — setting a loading flag synchronously in the effect body would
  // trigger a cascading render on every refreshKey change.
  const [items, setItems] = useState<TransitionEntry[] | null>(null);
  // Resolves the raw `performedBy` ObjectId into a display name.
  const allUsers = useUserStore(s => s.items);
  // Resolves the job a transition happened on (from the application id).
  const allApps = useApplicationStore(s => s.items);
  const allJobs = useJobStore(s => s.items);

  useEffect(() => {
    let alive = true;
    // includeRelated pulls in application-scoped rows that point at this
    // candidate, which is where rejections and hires are recorded.
    getJson<TransitionEntry[]>(
      `/shared/activity-logs/candidate/${candidateId}?includeRelated=true&limit=100`
    )
      .then(all => {
        if (!alive) return;
        const transitions = (all ?? []).filter(entry =>
          TRANSITION_ACTIONS.has(entry.action)
        );
        setItems(collapseSideEffects(transitions));
      })
      .catch(() => {
        // silently fail — the activity timeline above shows the full log
        if (alive) setItems(prev => prev ?? []);
      });
    return () => {
      alive = false;
    };
  }, [candidateId, refreshKey]);

  const performerName = useCallback(
    (performedBy: string | null | undefined) => {
      if (!performedBy) return null;
      const user = allUsers.find(u => u._id === performedBy);
      if (!user) return null;
      return `${user.firstName} ${user.lastName}`.trim() || null;
    },
    [allUsers]
  );

  /** Job title for an application-level entry, when we can resolve it. */
  const jobTitleForApplication = useCallback(
    (applicationId: string | null | undefined) => {
      if (!applicationId) return null;
      const app = allApps.find(a => a._id === applicationId);
      if (!app) return null;
      return allJobs.find(j => j._id === app.jobId)?.title ?? null;
    },
    [allApps, allJobs]
  );

  if (!items || items.length === 0) return null;

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Transition History
        </p>
        <div className="flex flex-col gap-2">
          {items.map((entry, i) => {
            const m = (entry.metadata ?? {}) as Record<
              string,
              string | undefined
            >;
            const destination = m.destination;
            const reasonLabel = m.reasonLabel;
            const legacyReason = m.reason;
            const lastStage = m.lastStage;
            const notes = m.internalNotes;
            const by = performerName(entry.performedBy);
            const jobTitle = jobTitleForApplication(entry.relatedId);

            // Eligibility flips carry `to` rather than a destination.
            const isEligibility = entry.action === 'eligibility_changed';
            const isTalentPool =
              entry.action === 'talent_pool_added' ||
              entry.action === 'talent_pool_removed';
            // A move closes the old application, but it is not a rejection.
            const isJobChange = entry.action === 'job_changed';

            const label = isEligibility
              ? m.to === 'permanently_ineligible'
                ? 'Ineligible'
                : 'Restored'
              : isTalentPool
                ? entry.action === 'talent_pool_added'
                  ? 'Talent Pool'
                  : 'Left Talent Pool'
                : isJobChange
                  ? 'Job Changed'
                  : entry.action === 'hired'
                    ? 'Hired'
                    : destination === 'permanently_ineligible'
                      ? 'Ineligible'
                      : destination === 'candidate_pool'
                        ? 'Talent Pool'
                        : 'Rejected';

            const tone =
              label === 'Ineligible'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : label === 'Hired'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : label === 'Restored'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : label === 'Job Changed'
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';

            return (
              <div
                key={entry._id ?? i}
                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn('text-[10px]', tone)}
                  >
                    {label}
                  </Badge>
                </div>
                {jobTitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Job: {jobTitle}
                  </p>
                )}
                {(reasonLabel || legacyReason) && (
                  <p className="mt-0.5 font-medium">
                    {reasonLabel || legacyReason}
                  </p>
                )}
                {lastStage && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last stage: {lastStage}
                  </p>
                )}
                {notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {notes}
                  </p>
                )}
                {by && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By: {by}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function CandidateDetailSheet({
  candidate,
  open,
  onOpenChange,
  mutating = false,
  hideAiScore = false,
}: Props) {
  const [talentPoolOpen, setTalentPoolOpen] = useState(false);
  const [assignJobOpen, setAssignJobOpen] = useState(false);
  const [removePoolConfirmOpen, setRemovePoolConfirmOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveEmailOpen, setApproveEmailOpen] = useState(false);
  const [approveEmailPoolOpen, setApproveEmailPoolOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEmailOpen, setRejectEmailOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // Tracks which email to compose after the current action completes.
  // 'approve' | 'reject' | null — drives the `mode` prop of ComposeEmailSheet.
  const [pendingEmailFor, setPendingEmailFor] = useState<
    'approve' | 'reject' | null
  >(null);

  // Pipeline action states
  const [stageOpen, setStageOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [rejectPipelineOpen, setRejectPipelineOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [changeJobOpen, setChangeJobOpen] = useState(false);
  const [jobDialogMode, setJobDialogMode] = useState<'change' | 'add'>('add');
  const [talentPoolConfirmOpen, setTalentPoolConfirmOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [approveJobId, setApproveJobId] = useState('');
  // Stores result from candidate approval so email compose has correct context
  const [approvedContext, setApprovedContext] = useState<{
    applicationId: string;
    jobId: string;
  } | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  // Permanently-ineligible flow (admin only): restore / legal hold / delete.
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ineligibleLoading, setIneligibleLoading] = useState(false);

  const applications = useApplicationStore(s => s.items);
  const appLoading = useApplicationStore(s => s.loading);
  const appMutating = useApplicationStore(s => s.mutating);
  const approveApp = useApplicationStore(s => s.approve);
  const hireApp = useApplicationStore(s => s.hire);
  const rejectApp = useApplicationStore(s => s.reject);

  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const assignJob = useCandidateStore(s => s.assignJob);
  const changeJob = useCandidateStore(s => s.changeJob);
  const approveCandidate = useCandidateStore(s => s.approve);
  const rejectCandidateStore = useCandidateStore(s => s.rejectCandidate);
  const updateCandidate = useCandidateStore(s => s.update);
  const restoreCandidate = useCandidateStore(s => s.restoreCandidate);
  const removeCandidate = useCandidateStore(s => s.remove);

  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);

  const emailTemplates = useEmailTemplateStore(s => s.items);
  const fetchEmailTemplates = useEmailTemplateStore(s => s.fetch);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const clients = useClientStore(s => s.items);

  // Applications are loaded by the candidates table into the shared store.
  // The detail sheet reads from the same store — no separate fetch needed.

  // Fetch jobs for the assign-to-job dialog
  useEffect(() => {
    if (hideAiScore && open && jobs.length === 0) {
      fetchJobs({ page: 1, limit: 9999 });
    }
  }, [hideAiScore, open, jobs.length, fetchJobs]);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  // Preload email templates so the compose sheet can offer template choices
  // without an extra round-trip when the user opens it.
  useEffect(() => {
    if (open && emailTemplates.length === 0) {
      fetchEmailTemplates();
    }
  }, [open, emailTemplates.length, fetchEmailTemplates]);

  // Interviews & users for pipeline detail view
  const interviews = useInterviewStore(s => s.items);
  const fetchInterviews = useInterviewStore(s => s.fetch);
  const fetchInterviewsByApplication = useInterviewStore(
    s => s.fetchByApplication
  );
  // Interview Scorecards (new feature) — gated to approved candidates
  // in the JSX below; fetch is candidate-scoped and lazy.
  const fetchScorecardsByCandidate = useInterviewScorecardStore(
    s => s.fetchByCandidate
  );
  const interviewScorecards = useInterviewScorecardStore(s => s.items);
  const cancelInterview = useInterviewStore(s => s.cancel);
  const completeAndFeedback = useInterviewStore(s => s.completeAndFeedback);
  const updateInterview = useInterviewStore(s => s.update);
  const createInterviewForApplication = useInterviewStore(
    s => s.createForApplication
  );
  const moveStage = useApplicationStore(s => s.moveStage);
  const updateAppNotes = useApplicationStore(s => s.updateNotes);
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleInterview, setRescheduleInterview] = useState<{
    _id: string;
    title: string;
    scheduledAt: string;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers();
    }
  }, [open, users.length, fetchUsers]);

  const openJobs = useMemo(
    () =>
      jobs
        .filter(j => j.status === 'open')
        .map(j => ({ _id: j._id, title: j.title })),
    [jobs]
  );

  /** Open jobs with the client name resolved, for the restore job picker. */
  const restoreJobs = useMemo(() => {
    const clientMap = new Map(clients.map(c => [c._id, c.companyName]));
    return jobs
      .filter(j => j.status === 'open')
      .map(j => ({
        _id: j._id,
        title: j.title,
        clientName: clientMap.get(j.clientId) ?? '',
      }));
  }, [jobs, clients]);

  const candidateApplications = applications.filter(
    a => a.candidateId === candidate?._id
  );

  /**
   * Jobs the restore target already holds an application for. The
   * (candidateId, jobId) index is unique regardless of phase, so restoring onto
   * one of these would block the approval that follows.
   */
  const blockedJobIdsForRestore = useMemo(
    () => new Set(candidateApplications.map(a => a.jobId)),
    [candidateApplications]
  );

  function getJobTitle(jobId: string) {
    return jobs.find(j => j._id === jobId)?.title ?? jobId;
  }

  function getClientName(clientId: string) {
    return clients.find(c => c._id === clientId)?.companyName ?? clientId;
  }

  async function handleAddToTalentPool(notes: string) {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'add', notes);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_added',
        `${fullName} added to talent pool`
      );
      toast.success('Added to Talent Pool');
      setTalentPoolOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleRemoveFromTalentPool() {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'remove');
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_removed',
        `${fullName} removed from talent pool`
      );
      toast.success('Removed from Talent Pool');
      setRemovePoolConfirmOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleUpdatePoolNotes(notes: string) {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'add', notes);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'note_updated',
        `Talent pool notes updated for ${fullName}`
      );
      toast.success('Notes saved');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  /**
   * Restore a permanently ineligible candidate. A job is required — they return
   * to **In Review** and must be approved normally; no application is created.
   */
  async function handleRestoreConfirm(target: Candidate, jobId: string) {
    setIneligibleLoading(true);
    try {
      await restoreCandidate(target._id, { jobId });
      logOptimisticActivity(
        'candidate',
        target._id,
        'eligibility_changed',
        `${fullName} restored from permanently ineligible`
      );
      toast.success('Candidate restored — now in review');
      setRestoreOpen(false);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to restore candidate');
    } finally {
      setIneligibleLoading(false);
    }
  }

  /**
   * Permanently delete a candidate. Mirrors the Ineligible list — this is the
   * only path in the ATS that removes a candidate and all their history.
   */
  async function handleDeleteConfirm() {
    if (!candidate) return;
    setIneligibleLoading(true);
    try {
      await removeCandidate(candidate._id);
      toast.success('Candidate permanently deleted');
      setDeleteOpen(false);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete candidate');
    } finally {
      setIneligibleLoading(false);
    }
  }

  async function handleToggleLegalHold() {
    if (!candidate) return;
    setIneligibleLoading(true);
    try {
      const next = !candidate.legalHold;
      await patchJson(`/ats/candidates/${candidate._id}/legal-hold`, {
        legalHold: next,
      });
      toast.success(`Legal hold ${next ? 'enabled' : 'disabled'}`);
      // The candidate prop is owned by the parent; refetch into the store so
      // the sheet reflects the new hold state without closing.
      await useCandidateStore.getState().fetchOne(candidate._id);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to toggle legal hold');
    } finally {
      setIneligibleLoading(false);
    }
  }

  async function handleAssignToJob(jobId: string) {
    if (!candidate) return;
    try {
      await assignJob(candidate._id, jobId);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'created',
        `Applied to job`
      );
      toast.success('Assigned to job');
      setAssignJobOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  /**
   * Find the candidate's pending application — pending-tab actions operate on
   * the single application that is still awaiting a decision. Returns null if
   * none is found (the buttons are only rendered when status === 'pending',
   * but defensive guard avoids runtime crashes).
   */
  const pendingApplication = useMemo(
    () => candidateApplications.find(a => a.phase === 'pending') ?? null,
    [candidateApplications]
  );

  /** Build ComposeEmailSheet "prefill" mode for the candidate of this sheet. */
  function buildComposeMode(
    templateType: 'offer' | 'rejection' | 'general' | 'follow_up',
    contextOverride?: { applicationId: string; jobId: string }
  ) {
    const appCtx =
      contextOverride ??
      (pendingApplication
        ? {
            applicationId: pendingApplication._id,
            jobId: pendingApplication.jobId,
          }
        : null);
    const clientId = appCtx
      ? (jobs.find(j => j._id === appCtx.jobId)?.clientId ??
        pendingApplication?.clientId ??
        '')
      : (pendingApplication?.clientId ?? '');
    const vars = {
      candidateName: fullName,
      candidateEmail: c.email,
      candidatePhone: c.phone ?? '',
      jobTitle: appCtx ? getJobTitle(appCtx.jobId) : '',
      clientName: appCtx ? getClientName(clientId) : '',
      currentStage: pendingApplication?.currentStage?.stageName ?? '',
      senderName: (() => {
        const u = useAuthStore.getState().user;
        return u ? `${u.firstName} ${u.lastName}`.trim() : '';
      })(),
    };
    const tpl: EmailTemplate | undefined = emailTemplates.find(
      t => t.type === templateType && t.isActive
    );
    return {
      type: 'prefill' as const,
      to: c.email,
      subject: tpl?.subject
        ? substituteTemplate(tpl.subject, vars)
        : defaultSubject(templateType),
      body: tpl?.bodyText ? substituteTemplate(tpl.bodyText, vars) : '',
      templateType,
      context: appCtx
        ? {
            type: templateType,
            candidateId: c._id,
            applicationId: appCtx.applicationId,
            jobId: appCtx.jobId,
          }
        : { type: templateType, candidateId: c._id },
      variables: vars,
    };
  }

  async function handleApproveConfirm() {
    if (!candidate) return;
    // Pending candidate — no application exists yet; approve the candidate
    if (candidate.status === 'pending') {
      if (!approveJobId) {
        toast.error('Please select a job to assign this candidate to');
        return;
      }
      setActionLoading(true);
      try {
        const result = await approveCandidate(candidate._id, approveJobId);
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'approved',
          `${fullName} approved`
        );
        logOptimisticActivity(
          'application',
          result.applicationId,
          'applied',
          'Application created'
        );
        toast.success('Candidate approved');
        setApproveJobId('');
        setApproveOpen(false);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    // Approved candidate with a pending application
    if (!pendingApplication) {
      toast.error('No pending application to approve');
      setApproveOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await approveApp(pendingApplication._id);
      logOptimisticActivity(
        'application',
        pendingApplication._id,
        'approved',
        'Application approved'
      );
      toast.success('Application approved');
      setApproveOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveAndEmailConfirm() {
    if (!candidate) return;
    if (candidate.status === 'pending') {
      if (!approveJobId) {
        toast.error('Please select a job to assign this candidate to');
        return;
      }
      setActionLoading(true);
      try {
        const result = await approveCandidate(candidate._id, approveJobId);
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'approved',
          `${fullName} approved`
        );
        logOptimisticActivity(
          'application',
          result.applicationId,
          'applied',
          'Application created'
        );
        toast.success('Candidate approved');
        setApproveJobId('');
        setApproveEmailOpen(false);
        setApprovedContext({
          applicationId: result.applicationId,
          jobId: result.jobId,
        });
        setPendingEmailFor('approve');
        setComposeOpen(true);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (!pendingApplication) {
      toast.error('No pending application to approve');
      setApproveEmailOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await approveApp(pendingApplication._id);
      logOptimisticActivity(
        'application',
        pendingApplication._id,
        'approved',
        'Application approved'
      );
      toast.success('Application approved');
      setApproveEmailOpen(false);
      setPendingEmailFor('approve');
      setComposeOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApproveEmailAndPoolConfirm() {
    if (!candidate) return;
    if (candidate.status === 'pending') {
      if (!approveJobId) {
        toast.error('Please select a job to assign this candidate to');
        return;
      }
      setActionLoading(true);
      try {
        const result = await approveCandidate(candidate._id, approveJobId);
        await updateTalentPool(candidate._id, 'add', '');
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'approved',
          `${fullName} approved`
        );
        logOptimisticActivity(
          'application',
          result.applicationId,
          'applied',
          'Application created'
        );
        logOptimisticActivity(
          'candidate',
          candidate._id,
          'talent_pool_added',
          `${fullName} added to talent pool`
        );
        toast.success('Approved & added to Talent Pool');
        setApproveJobId('');
        setApproveEmailPoolOpen(false);
        setApprovedContext({
          applicationId: result.applicationId,
          jobId: result.jobId,
        });
        setPendingEmailFor('approve');
        setComposeOpen(true);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    if (!pendingApplication) {
      toast.error('No pending application to approve');
      setApproveEmailPoolOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await approveApp(pendingApplication._id);
      await updateTalentPool(candidate._id, 'add', '');
      logOptimisticActivity(
        'application',
        pendingApplication._id,
        'approved',
        'Application approved'
      );
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_added',
        `${fullName} added to talent pool`
      );
      toast.success('Approved & added to Talent Pool');
      setApproveEmailPoolOpen(false);
      setPendingEmailFor('approve');
      setComposeOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Reject a candidate who is still In Review.
   *
   * Normally they hold no application, so this goes through the
   * candidate-level endpoint. If they DO hold a live application (possible
   * after an eligibility flip and restore), the candidate endpoint would
   * refuse — so route to that application instead, which removes them from
   * just that job.
   */
  async function handleRejectConfirm(payload: RejectPayload) {
    if (!candidate) {
      setRejectOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      const liveApp = candidateApplications.find(
        a => a.phase === 'pending' || a.phase === 'approved'
      );

      if (liveApp) {
        await rejectApp(liveApp._id, payload);
      } else {
        await rejectCandidateStore(candidate._id, payload);
      }

      logOptimisticActivity(
        'candidate',
        candidate._id,
        'rejected',
        'Candidate rejected',
        {
          reasonId: payload.rejectionReasonId,
          destination: payload.destination ?? null,
        }
      );
      toast.success(
        `${fullName} rejected` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectAndEmailConfirm(payload: RejectPayload) {
    if (!candidate) {
      setRejectEmailOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await rejectCandidateStore(candidate._id, payload);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'rejected',
        'Candidate rejected',
        {
          reasonId: payload.rejectionReasonId,
          destination: payload.destination ?? null,
        }
      );
      toast.success(`${fullName} rejected`);
      setRejectEmailOpen(false);
      setPendingEmailFor('reject');
      setComposeOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Pipeline action handlers — operate on the first approved application
  const activePipelineApp = useMemo(
    () => candidateApplications.find(a => a.phase === 'approved') ?? null,
    [candidateApplications]
  );

  /**
   * How many OTHER applications the candidate still has open, excluding the
   * one currently being acted on. When this is non-zero a reject must not ban
   * or pool them — that would silently destroy the other job's pipeline, so
   * the destination options are hidden.
   *
   * When there is no active pipeline application, the "current" one is the
   * first live application (the one handleRejectConfirm will act on), so it is
   * excluded explicitly rather than by comparing against `undefined`.
   */
  const otherLiveApplicationCount = useMemo(() => {
    const live = candidateApplications.filter(
      a => a.phase === 'pending' || a.phase === 'approved'
    );
    const current = activePipelineApp ?? live[0];
    if (!current) return 0;
    return live.filter(a => a._id !== current._id).length;
  }, [candidateApplications, activePipelineApp]);
  const pipelineJob = useMemo(
    () =>
      activePipelineApp
        ? (jobs.find(j => j._id === activePipelineApp.jobId) ?? null)
        : null,
    [jobs, activePipelineApp]
  );

  useEffect(() => {
    if (open && candidate) {
      if (activePipelineApp) {
        fetchInterviewsByApplication(activePipelineApp._id, { limit: 50 });
      } else {
        fetchInterviews({ candidateId: candidate._id, limit: 50 });
      }
    }
  }, [
    open,
    candidate,
    activePipelineApp,
    fetchInterviews,
    fetchInterviewsByApplication,
  ]);

  // Interview Scorecards fetch — mirrors the interviews fetch effect
  // directly above, but only fires when an approved candidate is open.
  useEffect(() => {
    if (open && candidate && candidate.status === 'approved') {
      void fetchScorecardsByCandidate(candidate._id);
    }
  }, [open, candidate, fetchScorecardsByCandidate]);

  // Dialog open-state for the Interview Scorecard entry form.
  const [scorecardFormOpen, setScorecardFormOpen] = useState(false);
  // The scorecard currently being edited (null = create mode).
  const [editingScorecard, setEditingScorecard] =
    useState<InterviewScorecard | null>(null);

  async function handleMoveStage() {
    if (!activePipelineApp || !selectedStageId) return;
    setPipelineLoading(true);
    try {
      const targetStage = pipelineJob?.pipeline?.stages?.find(
        s => s._id === selectedStageId
      );
      await moveStage(activePipelineApp._id, selectedStageId);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'stage_changed',
        `${fullName} moved to new stage`,
        {
          from: activePipelineApp.currentStage?.stageName ?? null,
          to: targetStage?.name ?? null,
        }
      );
      toast.success(`${fullName} moved to stage`);
      setStageOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleHire() {
    if (!activePipelineApp) return;
    setPipelineLoading(true);
    try {
      await hireApp(activePipelineApp._id);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'hired',
        `${fullName} hired`
      );
      toast.success(`${fullName} hired`);
      setHireOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleRejectPipeline(payload: RejectPayload) {
    if (!activePipelineApp) return;
    setPipelineLoading(true);
    try {
      await rejectApp(activePipelineApp._id, payload);
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'rejected',
        `${fullName} rejected from ${pipelineJob?.title ?? 'job'}`,
        {
          reasonId: payload.rejectionReasonId,
          destination: payload.destination ?? null,
        }
      );
      toast.success(
        `${fullName} rejected from ${pipelineJob?.title ?? 'this job'}` +
          (payload.destination === 'permanently_ineligible'
            ? ' and marked permanently ineligible'
            : payload.destination === 'candidate_pool'
              ? ' and moved to Talent Pool'
              : '')
      );
      setRejectPipelineOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleTalentPoolAction() {
    if (!candidate) return;
    setPipelineLoading(true);
    try {
      await updateTalentPool(
        candidate._id,
        candidate.inTalentPool ? 'remove' : 'add'
      );
      logOptimisticActivity(
        'candidate',
        candidate._id,
        candidate.inTalentPool ? 'talent_pool_removed' : 'talent_pool_added',
        candidate.inTalentPool
          ? `${fullName} removed from talent pool`
          : `${fullName} added to talent pool`
      );
      toast.success(
        candidate.inTalentPool
          ? `${fullName} removed from talent pool`
          : `${fullName} added to talent pool`
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  /**
   * Change the job on the candidate's active application.
   *
   * Implemented as a server-side composite — close the current application and
   * create one for the target job — because `jobId` is part of the unique
   * (candidateId, jobId) index and cannot be edited in place.
   */
  async function handleChangeJob(jobId: string, startStageId?: string) {
    if (!candidate || !activePipelineApp) return;
    setPipelineLoading(true);
    try {
      const targetJob = jobs.find(j => j._id === jobId);
      await changeJob(candidate._id, {
        applicationId: activePipelineApp._id,
        targetJobId: jobId,
        startStageId,
      });
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'updated',
        `Moved to ${targetJob?.title ?? 'another job'}`
      );
      toast.success(
        `${fullName} moved to ${targetJob?.title ?? 'the new job'}`
      );
      setChangeJobOpen(false);
      // Re-read applications so the Job/Stage columns reflect the closed and
      // newly created applications. A plain `fetch()` is a no-op after boot
      // (the store skips it when items are loaded and no explicit filter is
      // passed); `fetchScopedMerge` is the variant that actually writes.
      await useApplicationStore.getState().fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  /** Add another application without touching the current one. */
  async function handleAddJob(jobId: string, startStageId?: string) {
    if (!candidate) return;
    setPipelineLoading(true);
    try {
      await assignJob(candidate._id, jobId, startStageId);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'created',
        'Applied to another job'
      );
      toast.success(`${fullName} added to another job`);
      setChangeJobOpen(false);
      await useApplicationStore.getState().fetchScopedMerge({ limit: 9999 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleScheduleInterview(data: {
    title: string;
    type: string;
    interviewType: InterviewMeetingType;
    jobId: string;
    round: number;
    scheduledAt: string;
    duration: number;
    timezone: string;
    interviewerIds: string[];
    meetingLink: string;
    phoneNumber: string;
    address: string;
  }) {
    if (!activePipelineApp || !candidate) return;

    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    setPipelineLoading(true);
    try {
      await createInterviewForApplication(activePipelineApp._id, {
        title: data.title,
        type: data.type as Interview['type'],
        interviewType: data.interviewType,
        jobId: data.jobId || undefined,
        round: data.round,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        duration: data.duration,
        timezone: data.timezone,
        interviewerIds: data.interviewerIds,
        meetingDetails: {
          link: data.meetingLink || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
        },
      });
      fetchInterviewsByApplication(activePipelineApp._id, { limit: 50 });
      const typeLabel =
        INTERVIEW_MEETING_TYPE_LABELS[data.interviewType] ?? data.interviewType;
      const jobTitle =
        jobs.find(j => j._id === data.jobId)?.title ??
        pipelineJob?.title ??
        'this job';
      logOptimisticActivity(
        'application',
        activePipelineApp._id,
        'interview_scheduled',
        `Interview scheduled: ${typeLabel} for ${jobTitle}`
      );
      setScheduleOpen(false);
    } catch {
      // toast handled by store
    } finally {
      setPipelineLoading(false);
    }
  }

  // Read the latest version from the store so save operations are visible
  // immediately. The `candidate` prop is a snapshot from when the sheet
  // opened; `items` and `detail` stay current across mutations.
  const current = useCandidateStore(s => {
    if (!candidate) return undefined;
    // Prefer the individually-fetched detail, then the list item, then fall
    // back to the prop snapshot.
    return (
      s.detail[candidate._id] ?? s.items.find(i => i._id === candidate._id)
    );
  });

  if (!candidate) return null;

  const c = current ?? candidate;

  const fullName = `${c.firstName} ${c.lastName}`;
  const appliedJobTitle = c.appliedJobId ? getJobTitle(c.appliedJobId) : null;
  const bg = avatarBg(c.firstName);
  // Ineligible candidates have no pipeline and no live application, so every
  // other footer action (approve / reject / stage / hire) is meaningless.
  const isPermanentlyIneligible =
    c.eligibilityStatus === 'permanently_ineligible';
  const { aiScore, aiValidation, parsedData } = c;
  const hasValidation = !!aiValidation && aiValidation.score != null;
  const hasScoring =
    !!aiScore && aiScore.score != null && aiScore.recommendation != null;
  const fitCfg = getFitConfig(aiScore?.recommendation);
  const fitLabel = hasScoring ? fitCfg.label : null;
  const fitCls = hasScoring ? fitCfg.cls : '';

  const skills = parsedData?.skills ?? [];
  const languages = parsedData?.languages ?? [];
  const certifications = parsedData?.certifications ?? [];
  const experience = parsedData?.experience ?? [];
  const education = parsedData?.education ?? [];

  async function handleUpdateTags(tagIds: string[]) {
    try {
      await updateCandidate(c._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 max-w-none! w-full sm:w-[68vw] min-w-95"
        >
          {/* Header */}
          <SheetHeader className="shrink-0 border-b pl-6 pr-14 py-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={fullName}
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-semibold select-none',
                    bg
                  )}
                >
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight">
                  {fullName}
                </p>
                {(parsedData?.experience ?? [])[0] && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {parsedData!.experience![0].title}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MailIcon className="size-3.5" />
                    {c.email}
                  </a>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PhoneIcon className="size-3.5" />
                    {c.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BriefcaseIcon className="size-3.5" />
                    {c.yearsOfExperience} yrs exp
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {!hideAiScore && fitLabel && (
                    <Badge className={cn('bg-transparent font-medium', fitCls)}>
                      <SparklesIcon className="size-3" />
                      {fitLabel}
                    </Badge>
                  )}
                  {!hideAiScore && !fitLabel && hasValidation && (
                    <Badge
                      className={cn(
                        'bg-transparent font-medium',
                        aiValidation!.isValid
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-destructive'
                      )}
                    >
                      <SparklesIcon className="size-3" />
                      {aiValidation!.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  )}
                  {!hideAiScore && c.inTalentPool && (
                    <Badge className="border-violet-400 bg-transparent font-medium text-violet-700 dark:border-violet-400 dark:text-violet-300">
                      <StarIcon className="size-3" />
                      Talent Pool
                    </Badge>
                  )}
                  <TagsSelector
                    allTags={allTags}
                    selectedIds={getTagIds(c.tags)}
                    onChange={handleUpdateTags}
                    compact
                  />
                </div>
              </div>

              {!hideAiScore && (aiScore || hasValidation) && (
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      'text-2xl font-semibold tabular-nums leading-none',
                      scoreTextColor(aiScore?.score ?? aiValidation?.score ?? 0)
                    )}
                  >
                    {aiScore?.score ?? aiValidation?.score ?? 0}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {aiScore ? 'AI Score' : 'Validation'}
                  </p>
                  <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        scoreBarColor(
                          aiScore?.score ?? aiValidation?.score ?? 0
                        )
                      )}
                      style={{
                        width: `${aiScore?.score ?? aiValidation?.score ?? 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {hideAiScore && c.inTalentPool && (
                <div className="shrink-0 flex flex-col items-end gap-2 w-72">
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={mutating}
                    onClick={() => setRemovePoolConfirmOpen(true)}
                  >
                    <XIcon className="size-3" /> Remove from talent pool
                  </Button>
                  <div className="w-full rounded-md border bg-muted/30 px-3 py-3 min-h-24">
                    <TalentPoolNotesEditor
                      notes={c.talentPoolNotes ?? ''}
                      mutating={mutating}
                      onSave={handleUpdatePoolNotes}
                    />
                  </div>
                </div>
              )}
            </div>

            {hideAiScore && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  className="gap-1.5 px-4"
                  onClick={() => setAssignJobOpen(true)}
                >
                  <BriefcaseIcon className="size-3.5" />
                  Assign to a new job
                </Button>
              </div>
            )}
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              {/* AI Validation — candidacy authenticity check */}
              {!hideAiScore &&
                c.status === 'pending' &&
                hasValidation &&
                !hasScoring && (
                  <div className="flex flex-col gap-3">
                    <SectionLabel>AI Validation</SectionLabel>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {aiValidation!.isValid ? (
                            <CheckCircle2Icon className="size-5 text-[#3d8a5a]" />
                          ) : (
                            <XCircleIcon className="size-5 text-destructive" />
                          )}
                          <span className="text-sm font-semibold">
                            {aiValidation!.isValid
                              ? 'Candidacy Valid'
                              : 'Candidacy Invalid'}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            scoreTextColor(aiValidation!.score)
                          )}
                        >
                          {aiValidation!.score} / 100
                        </span>
                        <Badge
                          className={cn(
                            'bg-transparent font-medium shrink-0',
                            aiValidation!.isValid
                              ? 'text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                              : 'text-destructive border-destructive/30'
                          )}
                        >
                          {aiValidation!.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            scoreBarColor(aiValidation!.score)
                          )}
                          style={{ width: `${aiValidation!.score}%` }}
                        />
                      </div>
                      {aiValidation!.reason && (
                        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                          {aiValidation!.reason}
                        </p>
                      )}
                      {aiValidation!.completedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Validated {timeAgo(aiValidation!.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* AI Evaluation — job-fit scoring (pipeline candidates) */}
              {!hideAiScore && c.status === 'approved' && aiScore && (
                <div className="flex flex-col gap-3">
                  <SectionLabel>AI Evaluation</SectionLabel>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            scoreBarColor(aiScore.score)
                          )}
                          style={{ width: `${aiScore.score}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          scoreTextColor(aiScore.score)
                        )}
                      >
                        {aiScore.score} / 100
                      </span>
                      <Badge
                        className={cn(
                          'bg-transparent font-medium shrink-0',
                          fitCls
                        )}
                      >
                        {fitLabel}
                      </Badge>
                    </div>
                    {aiScore.summary && (
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                        {aiScore.summary}
                      </p>
                    )}
                  </div>
                  {((aiScore.strengths?.length ?? 0) > 0 ||
                    (aiScore.concerns?.length ?? 0) > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(aiScore.strengths?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-[#3d8a5a] dark:text-[#69c58a]">
                            Strengths
                          </p>
                          <ul className="flex flex-col gap-1">
                            {aiScore.strengths!.map((s, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#69c58a]" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(aiScore.concerns?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-destructive">
                            Concerns
                          </p>
                          <ul className="flex flex-col gap-1">
                            {aiScore.concerns!.map((c, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive/70" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {parsedData?.summary && (
                <>
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Summary</SectionLabel>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {parsedData.summary}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Skills</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex h-5 items-center rounded-full border border-border px-2 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {languages.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Languages:
                        </span>
                        {languages.map(lang => (
                          <span key={lang} className="text-xs font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                    {certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {certifications.map(cert => (
                          <span
                            key={cert}
                            className="inline-flex h-5 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 text-xs font-medium text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300"
                          >
                            <StarIcon className="size-2.5" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Experience</SectionLabel>
                    <ExperienceTimeline items={experience} />
                  </div>
                  <Separator />
                </>
              )}

              {/* Education */}
              {education.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Education</SectionLabel>
                    <EducationList items={education} />
                  </div>
                  <Separator />
                </>
              )}

              {/* Additional Info */}
              {(c.englishProficiency ||
                c.cityOfResidence ||
                c.currentSalaryPHP != null ||
                c.currentSalaryUSD != null ||
                c.reasonForLeaving) && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Additional Info</SectionLabel>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {c.englishProficiency && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            English Proficiency
                          </span>
                          <EnglishProficiencyBadge
                            level={c.englishProficiency}
                          />
                        </div>
                      )}
                      {c.cityOfResidence && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            City of Residence
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <MapPinIcon className="size-3.5 text-muted-foreground" />
                            {c.cityOfResidence}
                          </span>
                        </div>
                      )}
                      {c.currentSalaryPHP != null && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            Current Salary (PHP)
                          </span>
                          <span className="font-medium">
                            ₱{c.currentSalaryPHP.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {c.currentSalaryUSD != null && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            Current Salary (USD)
                          </span>
                          <span className="font-medium">
                            ${c.currentSalaryUSD.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {c.reasonForLeaving && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Reason for Leaving
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {c.reasonForLeaving}
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Applications */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <SectionLabel>Applications</SectionLabel>
                  <span className="text-xs text-muted-foreground">
                    ({candidateApplications.length})
                  </span>
                </div>
                {appLoading ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : candidateApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No applications yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {candidateApplications.map(app => {
                      const pJob = jobs.find(j => j._id === app.jobId);
                      const approver = app.approvedBy
                        ? users.find(u => u._id === app.approvedBy)
                        : null;
                      return (
                        <ApplicationCard
                          key={app._id}
                          app={app}
                          jobTitle={getJobTitle(app.jobId)}
                          clientName={getClientName(app.clientId)}
                          stages={pJob?.pipeline?.stages}
                          approverName={
                            approver
                              ? `${approver.firstName} ${approver.lastName}`
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pipeline-specific sections for approved candidates */}
              {c.status === 'approved' && (
                <>
                  <Separator />

                  {/* Interviews */}
                  {(() => {
                    const candidateInterviews = activePipelineApp
                      ? interviews.filter(
                          iv => iv.applicationId === activePipelineApp._id
                        )
                      : interviews.filter(iv => iv.candidateId === c._id);
                    return (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <SectionLabel>Interviews</SectionLabel>
                          <span className="text-xs text-muted-foreground">
                            ({candidateInterviews.length})
                          </span>
                        </div>
                        {candidateInterviews.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No interviews scheduled yet.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {candidateInterviews.map(iv => {
                              const ivInterviewers = users.filter(u =>
                                iv.interviewerIds.includes(u._id)
                              );
                              const typeLabel =
                                iv.type === 'zoom'
                                  ? 'Zoom'
                                  : iv.type === 'google_meet'
                                    ? 'Google Meet'
                                    : iv.type === 'phone_call'
                                      ? 'Phone Call'
                                      : 'In Person';
                              const statusCls =
                                iv.status === 'scheduled'
                                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300'
                                  : iv.status === 'completed'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                                    : iv.status === 'cancelled'
                                      ? 'border-muted bg-muted text-muted-foreground'
                                      : 'border-destructive/40 bg-destructive/5 text-destructive';
                              return (
                                <div
                                  key={iv._id}
                                  className="rounded-lg border p-3 flex flex-col gap-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">
                                        {iv.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Round {iv.round} · {typeLabel}
                                      </p>
                                    </div>
                                    <Badge
                                      className={cn(
                                        'h-5 text-[10px] capitalize font-medium',
                                        statusCls
                                      )}
                                      variant="outline"
                                    >
                                      {iv.status}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="size-3" />
                                      {formatDate(iv.scheduledAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <ClockIcon className="size-3" />
                                      {iv.duration} min
                                    </span>
                                  </div>
                                  {iv.meetingDetails?.address && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <MapPinIcon className="size-3 shrink-0" />
                                      <span className="truncate">
                                        {iv.meetingDetails.address}
                                      </span>
                                    </div>
                                  )}
                                  {iv.meetingDetails?.link && (
                                    <a
                                      href={iv.meetingDetails.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      <ExternalLinkIcon className="size-3" />
                                      Join meeting
                                    </a>
                                  )}
                                  {ivInterviewers.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">
                                        Interviewers:
                                      </span>
                                      <div className="flex -space-x-1">
                                        {ivInterviewers.map(u => (
                                          <div
                                            key={u._id}
                                            className="size-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-medium"
                                            title={`${u.firstName} ${u.lastName}`}
                                          >
                                            {u.firstName[0]}
                                            {u.lastName[0]}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {iv.feedbacks.length > 0 && (
                                    <div className="flex flex-col gap-1.5 mt-1">
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                        Feedback ({iv.feedbacks.length})
                                      </span>
                                      {iv.feedbacks.map(fb => {
                                        const fbUser = users.find(
                                          u => u._id === fb.interviewerId
                                        );
                                        return (
                                          <div
                                            key={fb._id}
                                            className="rounded-md bg-muted/40 px-2.5 py-2 text-xs flex flex-col gap-1"
                                          >
                                            <div className="flex items-center gap-2">
                                              {fbUser && (
                                                <span className="font-medium">
                                                  {fbUser.firstName}{' '}
                                                  {fbUser.lastName}
                                                </span>
                                              )}
                                              <span className="text-muted-foreground">
                                                {formatDate(fb.submittedAt)}
                                              </span>
                                              <span className="flex items-center gap-0.5 ml-auto">
                                                {Array.from({ length: 5 }).map(
                                                  (_, i) => (
                                                    <StarIcon
                                                      key={i}
                                                      className={cn(
                                                        'size-3',
                                                        i < fb.rating
                                                          ? 'fill-amber-400 text-amber-400'
                                                          : 'text-muted-foreground/30'
                                                      )}
                                                    />
                                                  )
                                                )}
                                              </span>
                                            </div>
                                            <span className="text-muted-foreground">
                                              {fb.notes}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {iv.status === 'scheduled' && (
                                    <InterviewCompleteFeedbackForm
                                      interviewId={iv._id}
                                      onComplete={async (id, data) => {
                                        await completeAndFeedback(
                                          id,
                                          data,
                                          activePipelineApp?._id
                                        );
                                        if (activePipelineApp) {
                                          fetchInterviewsByApplication(
                                            activePipelineApp._id,
                                            { limit: 50 }
                                          );
                                        } else {
                                          fetchInterviews({
                                            candidateId: c._id,
                                            limit: 50,
                                          });
                                        }
                                        if (activePipelineApp) {
                                          logOptimisticActivity(
                                            'application',
                                            activePipelineApp._id,
                                            'interview_completed',
                                            `Interview completed: ${iv.title}`
                                          );
                                        }
                                      }}
                                      onReschedule={() => {
                                        setRescheduleInterview({
                                          _id: iv._id,
                                          title: iv.title,
                                          scheduledAt: iv.scheduledAt,
                                          duration: iv.duration,
                                        });
                                        setRescheduleOpen(true);
                                      }}
                                      onCancel={async id => {
                                        await cancelInterview(
                                          id,
                                          activePipelineApp?._id
                                        );
                                        if (activePipelineApp) {
                                          fetchInterviewsByApplication(
                                            activePipelineApp._id,
                                            { limit: 50 }
                                          );
                                        } else {
                                          fetchInterviews({
                                            candidateId: c._id,
                                            limit: 50,
                                          });
                                        }
                                        if (activePipelineApp) {
                                          logOptimisticActivity(
                                            'application',
                                            activePipelineApp._id,
                                            'interview_cancelled',
                                            `Interview cancelled: ${iv.title}`
                                          );
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Interview Scorecards (new feature) — own section,
                      same visibility gate as the Interviews section above. */}
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <SectionLabel>Interview Scorecards</SectionLabel>
                      <span className="text-xs text-muted-foreground">
                        ({interviewScorecards.length})
                      </span>
                    </div>
                    <InterviewScorecardHistory
                      candidateId={c._id}
                      jobOptions={jobs.map(j => ({
                        _id: j._id,
                        title: j.title,
                      }))}
                      users={users.map(u => ({
                        _id: u._id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                      }))}
                      onAdd={() => {
                        setEditingScorecard(null);
                        setScorecardFormOpen(true);
                      }}
                      onEdit={scorecard => {
                        setEditingScorecard(scorecard);
                        setScorecardFormOpen(true);
                      }}
                    />
                    {/* Entry form — Dialog, mounted inside the gated section
                        so it only renders for approved candidates. Job
                        defaults to the active pipeline application's job. */}
                    <InterviewScorecardForm
                      open={scorecardFormOpen}
                      onOpenChange={open => {
                        setScorecardFormOpen(open);
                        if (!open) setEditingScorecard(null);
                      }}
                      candidateId={c._id}
                      defaultJobId={pipelineJob?._id ?? null}
                      editing={editingScorecard}
                      jobOptions={jobs.map(j => ({
                        _id: j._id,
                        title: j.title,
                      }))}
                      onCreated={() => {
                        if (c._id) void fetchScorecardsByCandidate(c._id);
                      }}
                    />
                  </div>

                  {/* Notes */}
                  {(() => {
                    const activeApp = candidateApplications.find(
                      a => a.phase === 'approved'
                    );
                    return (
                      <div className="flex flex-col gap-2">
                        <SectionLabel>Notes</SectionLabel>
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Add pipeline notes..."
                            value={notesText}
                            onChange={e => setNotesText(e.target.value)}
                            onFocus={() => {
                              if (!notesText && activeApp?.notes) {
                                setNotesText(activeApp.notes);
                              }
                            }}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingNotes || !activeApp}
                              onClick={async () => {
                                if (!activeApp) return;
                                setSavingNotes(true);
                                try {
                                  await updateAppNotes(
                                    activeApp._id,
                                    notesText
                                  );
                                  toast.success('Notes saved');
                                } catch (e) {
                                  toast.error((e as Error).message);
                                } finally {
                                  setSavingNotes(false);
                                }
                              }}
                            >
                              {savingNotes ? 'Saving…' : 'Save Notes'}
                            </Button>
                          </div>
                          {activeApp?.notes && (
                            <p className="text-xs text-muted-foreground">
                              Last saved: {formatDate(activeApp.updatedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Hired-specific sections */}
              {c.status === 'hired' && (
                <>
                  <Separator />

                  {/* Hired Applications */}
                  {(() => {
                    const hiredApps = candidateApplications.filter(
                      a => a.phase === 'hired'
                    );
                    if (hiredApps.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-3">
                        <SectionLabel>Hired Applications</SectionLabel>
                        <div className="flex flex-col gap-2">
                          {hiredApps.map(app => {
                            const hJob = jobs.find(j => j._id === app.jobId);
                            const hirer = app.hiredBy
                              ? users.find(u => u._id === app.hiredBy)
                              : null;
                            return (
                              <div
                                key={app._id}
                                className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-700/40 dark:bg-emerald-950/20 p-3 flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {hJob?.title ?? app.jobId}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {hJob
                                        ? getClientName(hJob.clientId)
                                        : app.clientId}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="h-5 text-[10px] font-medium border-[#69c58a] text-[#3d8a5a] dark:border-[#69c58a] dark:text-[#69c58a]"
                                  >
                                    Hired
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {app.hiredAt && (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">
                                        Hired Date
                                      </span>
                                      <span className="font-medium">
                                        {formatDate(app.hiredAt)}
                                      </span>
                                    </div>
                                  )}
                                  {hirer && (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground">
                                        Hired by
                                      </span>
                                      <span className="font-medium">
                                        {hirer.firstName} {hirer.lastName}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              <Separator />

              {/* Resume & Intro Video */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Resume & Intro Video</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  <ResumeViewer
                    url={c.resumeUrl}
                    filename={c.resumeOriginalName}
                  />
                  {c.videoIntroUrl ? (
                    <IntroVideo
                      url={c.videoIntroUrl}
                      source={c.videoIntroSource}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/20 h-96 p-4 text-center">
                      <VideoIcon className="size-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        No intro video available.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio — always shown so an absent portfolio is visible */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Portfolio</SectionLabel>
                <PortfolioSection
                  url={c.portfolioUrl}
                  fileUrl={c.portfolioFileUrl}
                  fileName={c.portfolioFileName}
                />
              </div>

              {/* CRM Profile */}
              {c.crmProfile && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <SectionLabel>CRM Profile</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {c.crmProfile.workloadLevel && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Workload
                          </p>
                          <Badge variant="outline" className="w-fit capitalize">
                            {c.crmProfile.workloadLevel}
                          </Badge>
                        </div>
                      )}
                      {c.crmProfile.satisfactionScore != null && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Satisfaction
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={cn(
                                  'size-3.5',
                                  i < c.crmProfile!.satisfactionScore!
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {c.crmProfile.lastVaCheckin && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Last VA Check-in
                          </p>
                          <p className="text-xs font-medium">
                            {c.crmProfile.lastVaCheckin}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.crmProfile.burnoutRiskFlag && (
                        <div className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/20 dark:text-orange-300">
                          <AlertTriangleIcon className="size-3.5" />
                          Burnout Risk
                        </div>
                      )}
                      {c.crmProfile.replacementRiskFlag && (
                        <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive">
                          <AlertCircleIcon className="size-3.5" />
                          Replacement Risk
                        </div>
                      )}
                    </div>
                    {c.crmProfile.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.crmProfile.notes}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Candidate activity trail — system events for this person
                  across all jobs (creation, profile edits, talent pool,
                  assignments). Per-job events live inside each
                  ApplicationCard above. Shown last so it summarises the
                  full candidate history. */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Candidate Activity</SectionLabel>
                <ActivityTimeline
                  resourceType="candidate"
                  resourceId={c._id}
                  compact
                />
              </div>

              {/* Rejection history — filtered from the same ActivityLog,
          shown as a compact summary when reject events exist */}
              <RejectionHistory candidateId={c._id} refreshKey={c.updatedAt} />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-6 py-4">
            {isPermanentlyIneligible ? (
              <IneligibleActions
                legalHold={!!c.legalHold}
                disabled={ineligibleLoading || mutating}
                onToggleLegalHold={handleToggleLegalHold}
                onRestore={() => setRestoreOpen(true)}
                onDelete={() => setDeleteOpen(true)}
              />
            ) : c.status === 'pending' ? (
              <PendingActionsToolbar
                disabled={actionLoading || appMutating}
                onApprove={() => {
                  setApproveJobId(c.appliedJobId || '');
                  setApproveOpen(true);
                }}
                onApproveAndEmail={() => {
                  setApproveJobId(c.appliedJobId || '');
                  setApproveEmailOpen(true);
                }}
                onApproveEmailAndPool={() => {
                  setApproveJobId(c.appliedJobId || '');
                  setApproveEmailPoolOpen(true);
                }}
                onReject={() => setRejectOpen(true)}
                onRejectAndEmail={() => setRejectEmailOpen(true)}
                onEmail={() => {
                  setPendingEmailFor(null);
                  setComposeOpen(true);
                }}
                onAddToTalentPool={() => setTalentPoolOpen(true)}
              />
            ) : c.status === 'approved' ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {/* Move Stage */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    pipelineLoading ||
                    !activePipelineApp ||
                    (pipelineJob?.pipeline?.stages?.length ?? 0) === 0
                  }
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setSelectedStageId(
                      activePipelineApp?.currentStage?.stageId ??
                        pipelineJob?.pipeline?.stages?.[0]?._id ??
                        ''
                    );
                    setStageOpen(true);
                  }}
                >
                  <GitCommitHorizontalIcon className="size-3.5" />
                  Move Stage
                </Button>
                {/* Schedule Interview */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading || !activePipelineApp}
                  className="h-8 gap-1.5"
                  onClick={() => setScheduleOpen(true)}
                >
                  <CalendarIcon className="size-3.5" />
                  Schedule
                </Button>
                {/* Hire */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading || !activePipelineApp}
                  className="h-8 gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                  onClick={() => setHireOpen(true)}
                >
                  <UserCheckIcon className="size-3.5" />
                  Hire
                </Button>
                {/* Reject */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading || !activePipelineApp}
                  className="h-8 gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setRejectPipelineOpen(true);
                  }}
                >
                  <BanIcon className="size-3.5" />
                  Reject
                </Button>
                {/* Email */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading}
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setPendingEmailFor(null);
                    setComposeOpen(true);
                  }}
                >
                  <MailIcon className="size-3.5" />
                  Email
                </Button>
                {/* Talent Pool */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading}
                  className="h-8 gap-1.5"
                  onClick={() => setTalentPoolConfirmOpen(true)}
                >
                  <StarIcon className="size-3.5" />
                  {c.inTalentPool ? 'Remove from Pool' : 'Add to Pool'}
                </Button>
                {/* Change Job — replaces the current job on this application */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    pipelineLoading ||
                    !activePipelineApp ||
                    openJobs.length === 0
                  }
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setJobDialogMode('change');
                    setChangeJobOpen(true);
                  }}
                >
                  <ArrowRightLeftIcon className="size-3.5" />
                  Change Job
                </Button>
                {/* Add to Job — keeps the current job and adds another */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading || openJobs.length === 0}
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setJobDialogMode('add');
                    setChangeJobOpen(true);
                  }}
                >
                  <PlusIcon className="size-3.5" />
                  Add to Job
                </Button>
              </div>
            ) : c.status === 'hired' ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading}
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setPendingEmailFor(null);
                    setComposeOpen(true);
                  }}
                >
                  <MailIcon className="size-3.5" />
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading}
                  className="h-8 gap-1.5"
                  onClick={() => setTalentPoolConfirmOpen(true)}
                >
                  <StarIcon className="size-3.5" />
                  {c.inTalentPool ? 'Remove from Pool' : 'Add to Pool'}
                </Button>
                <CandidateCrmButton
                  candidateId={c._id}
                  candidateStatus={c.status}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pipelineLoading || openJobs.length === 0}
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setJobDialogMode('add');
                    setChangeJobOpen(true);
                  }}
                >
                  <PlusIcon className="size-3.5" />
                  Add to Job
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Created{' '}
                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  ·{' '}
                  {c.source === 'applied'
                    ? 'Applied Directly'
                    : 'Internal Upload'}
                </span>
                {/* CRM Provision for hired candidates */}
                <CandidateCrmButton
                  candidateId={c._id}
                  candidateStatus={c.status}
                />
                <Button
                  variant="outline"
                  className="ml-auto"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TalentPoolDialog
        open={talentPoolOpen}
        onClose={() => setTalentPoolOpen(false)}
        onConfirm={handleAddToTalentPool}
      />

      <AssignJobDialog
        open={assignJobOpen}
        onClose={() => setAssignJobOpen(false)}
        onConfirm={handleAssignToJob}
        jobs={openJobs}
      />

      {/* Approve */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={open => {
          setApproveOpen(open);
          if (!open) setApproveJobId('');
        }}
        variant="success"
        title={
          candidate?.status === 'pending'
            ? 'Approve candidate'
            : 'Approve application'
        }
        description={
          candidate?.status === 'pending' ? (
            c.appliedJobId ? (
              <>
                Approve{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                for{' '}
                <span className="font-medium text-foreground">
                  {appliedJobTitle}
                </span>
                ? This creates their application in the pipeline.
              </>
            ) : (
              <>
                Select a job to assign{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                to. This approves the candidate and creates their application in
                the pipeline.
              </>
            )
          ) : (
            <>
              Approve{' '}
              <span className="font-medium text-foreground">{fullName}</span>{' '}
              for the pending application? This moves the candidate into the
              pipeline.
            </>
          )
        }
        confirmLabel="Approve"
        loading={actionLoading}
        confirmDisabled={candidate?.status === 'pending' && !approveJobId}
        onConfirm={handleApproveConfirm}
      >
        {candidate?.status === 'pending' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Assign to job</Label>
            {c.appliedJobId ? (
              <p className="text-sm font-medium">{appliedJobTitle}</p>
            ) : (
              <Select value={approveJobId} onValueChange={setApproveJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job…" />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </ConfirmDialog>

      {/* Approve & Email */}
      <ConfirmDialog
        open={approveEmailOpen}
        onOpenChange={open => {
          setApproveEmailOpen(open);
          if (!open) setApproveJobId('');
        }}
        variant="success"
        title={
          candidate?.status === 'pending'
            ? 'Approve candidate & email'
            : 'Approve & email'
        }
        description={
          candidate?.status === 'pending' ? (
            c.appliedJobId ? (
              <>
                Approve{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                for{' '}
                <span className="font-medium text-foreground">
                  {appliedJobTitle}
                </span>{' '}
                and open the email composer with the approval template.
              </>
            ) : (
              <>
                Select a job to assign{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                to, then open the email composer with the approval template.
              </>
            )
          ) : (
            <>
              Approve{' '}
              <span className="font-medium text-foreground">{fullName}</span>{' '}
              and open the email composer with the approval template? You will
              be able to review the email before sending.
            </>
          )
        }
        confirmLabel="Approve & open composer"
        loading={actionLoading}
        confirmDisabled={candidate?.status === 'pending' && !approveJobId}
        onConfirm={handleApproveAndEmailConfirm}
      >
        {candidate?.status === 'pending' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Assign to job</Label>
            {c.appliedJobId ? (
              <p className="text-sm font-medium">{appliedJobTitle}</p>
            ) : (
              <Select value={approveJobId} onValueChange={setApproveJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job…" />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </ConfirmDialog>

      {/* Approve, Email & Add to Talent Pool */}
      <ConfirmDialog
        open={approveEmailPoolOpen}
        onOpenChange={open => {
          setApproveEmailPoolOpen(open);
          if (!open) setApproveJobId('');
        }}
        variant="success"
        title={
          candidate?.status === 'pending'
            ? 'Approve candidate, email & talent pool'
            : 'Approve, email & add to talent pool'
        }
        description={
          candidate?.status === 'pending' ? (
            c.appliedJobId ? (
              <>
                Approve{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                for{' '}
                <span className="font-medium text-foreground">
                  {appliedJobTitle}
                </span>
                , add them to the talent pool, and open the email composer with
                the approval template.
              </>
            ) : (
              <>
                Select a job to assign{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                to, add them to the talent pool, and open the email composer
                with the approval template.
              </>
            )
          ) : (
            <>
              Approve{' '}
              <span className="font-medium text-foreground">{fullName}</span>,
              add them to the talent pool, and open the email composer with the
              approval template?
            </>
          )
        }
        confirmLabel="Approve & open composer"
        loading={actionLoading}
        confirmDisabled={candidate?.status === 'pending' && !approveJobId}
        onConfirm={handleApproveEmailAndPoolConfirm}
      >
        {candidate?.status === 'pending' && (
          <div className="space-y-1.5">
            <Label className="text-sm">Assign to job</Label>
            {c.appliedJobId ? (
              <p className="text-sm font-medium">{appliedJobTitle}</p>
            ) : (
              <Select value={approveJobId} onValueChange={setApproveJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job…" />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </ConfirmDialog>

      {/* Reject (In Review) — structured reason + destination.
          No application normally exists, so this rejects at candidate level;
          if one does, handleRejectConfirm routes to it instead. */}
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        candidateName={fullName}
        jobTitle={appliedJobTitle ?? undefined}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={actionLoading}
        onConfirm={handleRejectConfirm}
      />

      {/* Reject & Email — same flow, then opens the composer. */}
      <RejectDialog
        open={rejectEmailOpen}
        onOpenChange={setRejectEmailOpen}
        candidateName={fullName}
        jobTitle={appliedJobTitle ?? undefined}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={actionLoading}
        onConfirm={handleRejectAndEmailConfirm}
      />

      {/* Email composer — used for standalone Email, Approve & Email,
          Approve/Email/Pool, and Reject & Email flows. `pendingEmailFor`
          tracks which template type to prefill. */}
      <ComposeEmailSheet
        open={composeOpen}
        onOpenChange={open => {
          setComposeOpen(open);
          if (!open) setApprovedContext(null);
        }}
        mode={
          pendingEmailFor === 'approve'
            ? buildComposeMode('offer', approvedContext ?? undefined)
            : pendingEmailFor === 'reject'
              ? buildComposeMode('rejection')
              : buildComposeMode('general')
        }
      />

      {/* Remove from talent pool confirmation */}
      <Dialog
        open={removePoolConfirmOpen}
        onOpenChange={v => !v && setRemovePoolConfirmOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from Talent Pool</DialogTitle>
            <DialogDescription className="flex flex-col gap-3 pt-2">
              <p>
                You are about to remove{' '}
                <span className="font-medium text-foreground">
                  {candidate
                    ? `${c.firstName} ${c.lastName}`
                    : 'this candidate'}
                </span>{' '}
                from the talent pool.
              </p>
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
                They will no longer appear in saved candidates. Nothing else
                changes — their profile and history are kept.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemovePoolConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFromTalentPool}>
              Remove from pool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Schedule Interview */}
      <ScheduleInterviewDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={handleScheduleInterview}
        candidateName={fullName}
        job={pipelineJob}
        jobs={openJobs}
        users={users.map(u => ({
          _id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
        }))}
        loading={pipelineLoading}
      />

      {/* Reschedule Interview */}
      <RescheduleDialog
        open={rescheduleOpen}
        onClose={() => {
          setRescheduleOpen(false);
          setRescheduleInterview(null);
        }}
        onConfirm={async data => {
          if (!rescheduleInterview) return;
          await updateInterview(
            rescheduleInterview._id,
            {
              scheduledAt: data.scheduledAt,
              duration: data.duration,
            },
            activePipelineApp?._id
          );
          if (activePipelineApp) {
            fetchInterviewsByApplication(activePipelineApp._id, { limit: 50 });
          } else {
            fetchInterviews({ candidateId: c._id, limit: 50 });
          }
          if (activePipelineApp) {
            logOptimisticActivity(
              'application',
              activePipelineApp._id,
              'interview_updated',
              `Interview rescheduled: ${rescheduleInterview.title}`
            );
          }
          setRescheduleOpen(false);
          setRescheduleInterview(null);
        }}
        interviewTitle={rescheduleInterview?.title ?? ''}
        currentDate={rescheduleInterview?.scheduledAt ?? ''}
        currentDuration={rescheduleInterview?.duration ?? 30}
        loading={actionLoading}
      />

      {/* Pipeline: Move Stage */}
      {pipelineJob?.pipeline?.stages && (
        <Dialog open={stageOpen} onOpenChange={setStageOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Move Stage</DialogTitle>
              <DialogDescription>
                Advance <span className="font-medium">{fullName}</span> to the
                next pipeline stage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Select Stage</Label>
              <Select
                value={selectedStageId}
                onValueChange={setSelectedStageId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a stage..." />
                </SelectTrigger>
                <SelectContent>
                  {pipelineJob.pipeline.stages
                    .filter(s => s.isActive !== false)
                    .map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStageOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleMoveStage}
                disabled={!selectedStageId || pipelineLoading}
              >
                {pipelineLoading ? 'Moving…' : 'Move Stage'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Pipeline: Hire Confirm */}
      <Dialog open={hireOpen} onOpenChange={setHireOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hire Candidate</DialogTitle>
            <DialogDescription>
              Mark <span className="font-medium">{fullName}</span> as hired for{' '}
              <span className="font-medium">
                {pipelineJob?.title ?? 'this job'}
              </span>
              ? This completes the pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHire} disabled={pipelineLoading}>
              {pipelineLoading ? 'Hiring…' : 'Confirm Hire'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pipeline: Reject — structured reason + destination.
          Destination is offered only when this is the candidate's last live
          application (otherwise it is hidden inside the dialog). */}
      <RejectDialog
        open={rejectPipelineOpen}
        onOpenChange={setRejectPipelineOpen}
        candidateName={fullName}
        jobTitle={pipelineJob?.title ?? undefined}
        currentStageName={activePipelineApp?.currentStage?.stageName}
        hasOtherLiveApplication={otherLiveApplicationCount > 0}
        submitting={pipelineLoading}
        onConfirm={handleRejectPipeline}
      />

      {/* Job & Stage — change the job on this application, or add another */}
      <ChangeJobDialog
        open={changeJobOpen}
        onOpenChange={setChangeJobOpen}
        mode={jobDialogMode}
        candidateName={fullName}
        currentJobTitle={pipelineJob?.title ?? appliedJobTitle ?? undefined}
        currentJobId={activePipelineApp?.jobId}
        jobs={openJobs
          .filter(j =>
            // Any job the candidate already holds would be rejected with a 409
            // (the (candidateId, jobId) index is unique regardless of phase).
            // In `change` mode the current job stays listed so the dialog can
            // show it as the one being moved away from — it excludes it itself.
            jobDialogMode === 'change'
              ? !blockedJobIdsForRestore.has(j._id) ||
                j._id === activePipelineApp?.jobId
              : !blockedJobIdsForRestore.has(j._id)
          )
          .map(j => ({
            ...j,
            stages: (jobs.find(x => x._id === j._id)?.pipeline?.stages ?? [])
              .filter(s => s.isActive !== false)
              .sort((a, b) => a.order - b.order)
              .map(s => ({ _id: s._id, name: s.name })),
          }))}
        submitting={pipelineLoading}
        onConfirm={jobDialogMode === 'change' ? handleChangeJob : handleAddJob}
      />

      {/* Pipeline: Talent Pool Confirm */}
      <Dialog
        open={talentPoolConfirmOpen}
        onOpenChange={setTalentPoolConfirmOpen}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {c?.inTalentPool
                ? 'Remove from Talent Pool'
                : 'Add to Talent Pool'}
            </DialogTitle>
            <DialogDescription>
              {c?.inTalentPool ? (
                <>
                  Remove <span className="font-medium">{fullName}</span> from
                  the talent pool? They will no longer appear in saved
                  candidates.
                </>
              ) : (
                <>
                  Add <span className="font-medium">{fullName}</span> to the
                  talent pool? They will be saved for future opportunities.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTalentPoolConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setTalentPoolConfirmOpen(false);
                handleTalentPoolAction();
              }}
              disabled={pipelineLoading}
            >
              {c?.inTalentPool ? 'Remove' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanently ineligible: Restore — a job is required. */}
      <RestoreCandidateDialog
        candidate={isPermanentlyIneligible && restoreOpen ? c : null}
        jobs={restoreJobs}
        blockedJobIds={blockedJobIdsForRestore}
        submitting={ineligibleLoading}
        onClose={() => setRestoreOpen(false)}
        onConfirm={handleRestoreConfirm}
      />

      {/* Permanently ineligible: the only permanent-delete path in the ATS. */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Permanently Delete Candidate
            </DialogTitle>
            <DialogDescription className="flex flex-col gap-3 pt-2">
              <p>
                This will permanently delete{' '}
                <span className="font-medium text-foreground">{fullName}</span>{' '}
                and all associated data — applications, interviews, emails, and
                history — across every job.
              </p>
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs">
                This action <em>cannot</em> be undone. To keep their history
                instead, use Restore.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={ineligibleLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={ineligibleLoading}
              onClick={handleDeleteConfirm}
            >
              {ineligibleLoading ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
