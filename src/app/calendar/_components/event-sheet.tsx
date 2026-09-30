import {
  ScheduleInterviewDialog,
  type ScheduleInterviewInput,
} from '@/components/schedule-interview-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useInterviewerOptions } from '@/hooks/use-interviewer-options';
import { logOptimisticActivity } from '@/lib/activity';
import {
  DEFAULT_TIMEZONE,
  getZonedDate,
  getZonedTime,
  zonedWallClockToUtc,
} from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { useApplicationStore } from '@/store/slices/applications.store';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import {
  type Interview,
  type InterviewRecommendation,
  type InterviewStatus,
  type InterviewType,
} from '@/store/types';
import {
  ClockIcon,
  CopyIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  formatScheduledAt,
  getInterviewEndTime,
  getInterviewStartTime,
} from '../_utils/calendar-helpers';

const TYPE_STYLES: Record<InterviewType, string> = {
  zoom: 'bg-primary/10 text-primary border-primary/20',
  google_meet:
    'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  phone_call:
    'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  in_person:
    'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
};

const TYPE_LABELS: Record<InterviewType, string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'Phone Call',
  in_person: 'In Person',
};

const STATUS_STYLES: Record<InterviewStatus, string> = {
  scheduled: 'text-primary border-primary/30',
  completed: 'text-green-600 border-green-500/30 dark:text-green-400',
  cancelled: 'text-destructive border-destructive/30',
  no_show: 'text-orange-600 border-orange-500/30 dark:text-orange-400',
};

const STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const RECOMMENDATION_LABELS: Record<InterviewRecommendation, string> = {
  strong_yes: 'Strong Yes',
  yes: 'Yes',
  neutral: 'Neutral',
  no: 'No',
  strong_no: 'Strong No',
};

/* ------------------------------------------------------------------ */
/*  EventDetail — view mode with actions                               */
/* ------------------------------------------------------------------ */

function EventDetail({
  event,
  candidateName,
  jobTitle,
  interviewerNames,
  onEdit,
}: {
  event: Interview;
  candidateName?: string;
  jobTitle?: string;
  interviewerNames: Record<string, string>;
  onEdit: () => void;
}) {
  const cancelInterview = useInterviewStore(s => s.cancel);
  const submitFeedback = useInterviewStore(s => s.submitFeedback);
  const updateInterview = useInterviewStore(s => s.update);
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  const endTime = getInterviewEndTime(
    event.scheduledAt,
    event.duration,
    event.timezone
  );
  const m = event.meetingDetails;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] =
    useState<InterviewRecommendation>('yes');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [noShowing, setNoShowing] = useState(false);

  async function handleSubmitFeedback() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await submitFeedback(
        event._id,
        { rating, notes, recommendation },
        event.applicationId
      );
      logOptimisticActivity(
        'application',
        event.applicationId,
        'interview_feedback_submitted',
        `Feedback submitted for: ${event.title}`
      );
      setFeedbackOpen(false);
      setRating(0);
      setNotes('');
    } catch {
      // toast handled by store
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await updateInterview(
        event._id,
        { status: 'completed' },
        event.applicationId
      );
      logOptimisticActivity(
        'application',
        event.applicationId,
        'interview_completed',
        `Interview completed: ${event.title}`
      );
    } catch {
      // toast handled by store
    } finally {
      setCompleting(false);
    }
  }

  /**
   * Mark as No Show.
   *
   * The status, the filter option and the backend transition all existed
   * already — there was simply no control to reach it, so the only way to
   * record a no-show was to edit the database.
   */
  async function handleNoShow() {
    setNoShowing(true);
    try {
      await updateInterview(
        event._id,
        { status: 'no_show' },
        event.applicationId
      );
      logOptimisticActivity(
        'application',
        event.applicationId,
        'interview_no_show',
        `Candidate did not show: ${event.title}`
      );
    } catch {
      // toast handled by store
    } finally {
      setNoShowing(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelInterview(event._id, event.applicationId);
    } catch {
      // toast handled by store
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded border font-medium',
            TYPE_STYLES[event.type]
          )}
        >
          {TYPE_LABELS[event.type]}
        </span>
        <Badge
          variant="outline"
          className={cn('text-xs', STATUS_STYLES[event.status])}
        >
          {STATUS_LABELS[event.status]}
        </Badge>
      </div>

      {(candidateName || jobTitle) && (
        <div className="flex flex-col gap-1.5">
          {candidateName && (
            <Badge variant="secondary" className="text-xs w-fit">
              {candidateName}
            </Badge>
          )}
          {jobTitle && (
            <p className="text-sm font-medium text-foreground/80 leading-snug mt-1">
              {jobTitle}
            </p>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 text-sm">
        <ClockIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">
            {formatScheduledAt(event.scheduledAt, event.timezone)}
          </p>
          <p className="text-muted-foreground">
            {startTime} – {endTime} · {event.duration} min · {event.timezone}
          </p>
        </div>
      </div>

      {m?.link && (
        <div className="flex items-start gap-3 text-sm">
          <LinkIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(m.link!);
                toast.success('Link copied to clipboard');
              }}
              className="text-primary underline-offset-2 hover:underline text-left break-all"
            >
              {m.link}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(m.link!);
                toast.success('Link copied to clipboard');
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              title="Copy link"
            >
              <CopyIcon className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {m?.phoneNumber && (
        <div className="flex items-center gap-3 text-sm">
          <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
          <span>{m.phoneNumber}</span>
        </div>
      )}

      {m?.address && (
        <div className="flex items-center gap-3 text-sm">
          <MapPinIcon className="size-4 text-muted-foreground shrink-0" />
          <span>{m.address}</span>
        </div>
      )}

      {event.interviewerIds.length > 0 && (
        <div className="flex items-start gap-3 text-sm">
          <UsersIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {(
              event.interviewerNames ??
              event.interviewerIds.map(id => interviewerNames[id] ?? id)
            ).map((name, i) => (
              <Badge
                key={event.interviewerIds[i] ?? i}
                variant="secondary"
                className="text-xs font-medium"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {event.feedbacks.length > 0 && (
        <>
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Feedback ({event.feedbacks.length})
          </p>
          {event.feedbacks.map(fb => (
            <div
              key={fb._id}
              className="rounded-md border px-3 py-2 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {interviewerNames[fb.interviewerId] ?? fb.interviewerId}
                </span>
                <span className="text-muted-foreground">
                  {'★'.repeat(fb.rating)}
                  {'☆'.repeat(5 - fb.rating)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{fb.notes}</p>
              <span className="text-[10px] text-muted-foreground/70">
                {RECOMMENDATION_LABELS[fb.recommendation]}
              </span>
            </div>
          ))}
        </>
      )}

      {feedbackOpen && (
        <div className="rounded-md border p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold">Submit Feedback</p>
          <div
            role="group"
            aria-label="Interview rating"
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="text-lg"
                aria-label={`${i} of 5 stars`}
                aria-pressed={i === rating}
              >
                <StarIcon
                  className={cn(
                    'size-5',
                    i <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
          <Select
            value={recommendation}
            onValueChange={v => setRecommendation(v as InterviewRecommendation)}
          >
            <SelectTrigger className="h-8 text-xs">
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
          <Textarea
            placeholder="Notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="text-xs"
            rows={2}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitFeedback}
              disabled={!rating || submitting}
            >
              {submitting ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}

      {event.status === 'scheduled' && (
        <>
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeedbackOpen(v => !v)}
            >
              Feedback
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {completing ? 'Completing...' : 'Mark as Complete'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNoShow}
              disabled={noShowing}
              className="text-warning border-warning/40 hover:bg-warning/10"
            >
              {noShowing ? 'Saving...' : 'No Show'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Interview'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EventSheet — top-level wrapper                                     */
/* ------------------------------------------------------------------ */

interface EventSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: Interview | null;
  /** Day cell that was clicked, used to pre-fill the date. `YYYY-MM-DD`. */
  defaultDate?: string;
  onMutate: () => void;
}

/** A candidate that can be scheduled against, with the job they applied to. */
interface SchedulableCandidate {
  applicationId: string;
  candidateId: string;
  jobId: string;
  clientId: string;
  firstName: string;
  lastName: string;
}

export function EventSheet({
  open,
  onOpenChange,
  event,
  defaultDate,
  onMutate,
}: EventSheetProps) {
  const candidates = useCandidateStore(s => s.items);
  const fetchCandidates = useCandidateStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const fetchApplications = useApplicationStore(s => s.fetch);
  const createInterview = useInterviewStore(s => s.create);
  const updateInterview = useInterviewStore(s => s.update);
  const settings = useSettingsStore(s => s.settings);
  // Scoped to ATS staff — the boot-loaded list also holds CRM-only accounts.
  // Gated on `open`: the calendar mounts this sheet permanently, so an
  // unconditional fetch would hit the API on every calendar visit. The detail
  // view prefers the backend-provided `interviewerNames` anyway.
  const { interviewers } = useInterviewerOptions(open);
  const users = useMemo(
    () =>
      interviewers.map(u => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
      })),
    [interviewers]
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Create-flow selections. The shared dialog owns its own text/date state; the
  // calendar only needs to know WHICH candidate and job it is scheduling for.
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  useEffect(() => {
    if (open) {
      setEditing(false);
      setSelectedJobId('');
      setSelectedCandidateId('');
      if (candidates.length === 0) fetchCandidates({ limit: 200 });
      if (jobs.length === 0) fetchJobs({ limit: 200 });
      if (applications.length === 0) fetchApplications({ limit: 9999 });
    }
  }, [open]);

  const timezone = settings?.companyTimezone || DEFAULT_TIMEZONE;

  const candidateName = event
    ? (() => {
        const c = candidates.find(x => x._id === event.candidateId);
        return c ? `${c.firstName} ${c.lastName}` : undefined;
      })()
    : undefined;

  const jobTitle = event
    ? jobs.find(j => j._id === event.jobId)?.title
    : undefined;

  const interviewerNames: Record<string, string> = {};
  for (const u of users) {
    interviewerNames[u._id] = `${u.firstName} ${u.lastName}`;
  }

  const today = new Date();
  const fallbackDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const openJobs = useMemo(() => jobs.filter(j => j.status === 'open'), [jobs]);

  /**
   * Candidates eligible for scheduling, with the job/client their application
   * belongs to. Built from APPROVED applications only — an interview needs a
   * live application, and the create endpoint derives everything from it.
   */
  const schedulable = useMemo<SchedulableCandidate[]>(() => {
    const byId = new Map(candidates.map(c => [c._id, c]));
    return applications
      .filter(a => a.phase === 'approved')
      .map(a => {
        const c = byId.get(a.candidateId);
        if (!c) return null;
        return {
          applicationId: a._id,
          candidateId: a.candidateId,
          jobId: a.jobId,
          clientId: a.clientId,
          firstName: c.firstName,
          lastName: c.lastName,
        };
      })
      .filter((x): x is SchedulableCandidate => x !== null);
  }, [applications, candidates]);

  const candidatesForJob = useMemo(
    () => schedulable.filter(c => c.jobId === selectedJobId),
    [schedulable, selectedJobId]
  );

  const selectedCandidate = useMemo(
    () => schedulable.find(c => c.candidateId === selectedCandidateId) ?? null,
    [schedulable, selectedCandidateId]
  );

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  /** Create a new interview from the calendar's New Event flow. */
  async function handleCreate(data: ScheduleInterviewInput) {
    if (!selectedCandidate) {
      toast.error('Select a candidate first');
      return;
    }
    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    const scheduledAt = zonedWallClockToUtc(
      data.scheduledAt.slice(0, 10),
      data.scheduledAt.slice(11, 16),
      timezone
    );
    if (!scheduledAt) {
      toast.error('Please enter a valid date and time');
      return;
    }

    setSaving(true);
    try {
      await createInterview({
        applicationId: selectedCandidate.applicationId,
        candidateId: selectedCandidate.candidateId,
        jobId: selectedCandidate.jobId,
        clientId: selectedCandidate.clientId,
        title: data.title,
        type: data.type as Interview['type'],
        scheduledAt,
        interviewerIds: data.interviewerIds,
        meetingDetails: {
          link: data.meetingLink || null,
          phoneNumber: data.phoneNumber || null,
          address: data.address || null,
        },
      });
      onMutate();
      onOpenChange(false);
    } catch {
      // toast handled by store
    } finally {
      setSaving(false);
    }
  }

  /** Save changes to an existing interview. */
  async function handleEdit(data: ScheduleInterviewInput) {
    if (!event) return;
    if (data.type === 'google_meet' && !data.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }
    const scheduledAt = zonedWallClockToUtc(
      data.scheduledAt.slice(0, 10),
      data.scheduledAt.slice(11, 16),
      timezone
    );
    if (!scheduledAt) {
      toast.error('Please enter a valid date and time');
      return;
    }

    setSaving(true);
    try {
      await updateInterview(
        event._id,
        {
          title: data.title,
          type: data.type as Interview['type'],
          scheduledAt,
          interviewerIds: data.interviewerIds,
          meetingDetails: {
            link: data.meetingLink || null,
            phoneNumber: data.phoneNumber || null,
            address: data.address || null,
          },
        },
        event.applicationId
      );
      setEditing(false);
      onMutate();
    } catch {
      // toast handled by store
    } finally {
      setSaving(false);
    }
  }

  const title = event
    ? editing
      ? 'Edit Interview'
      : event.title
    : 'Schedule Interview';

  // The create flow uses the SAME shared dialog as the candidates table and the
  // detail sheet, so there is exactly one scheduling form in the product.
  if (open && (editing || !event)) {
    const dialogProps = editing
      ? {
          mode: 'edit' as const,
          candidateName: candidateName ?? '',
          candidates: undefined,
          candidateId: undefined,
          onCandidateChange: undefined,
          job: jobs.find(j => j._id === event!.jobId) ?? null,
          onJobChange: undefined,
          initial: {
            title: event!.title,
            type: event!.type,
            date: getZonedDate(event!.scheduledAt, event!.timezone),
            time: getZonedTime(event!.scheduledAt, event!.timezone),
            meetingLink: event!.meetingDetails?.link ?? '',
            phoneNumber: event!.meetingDetails?.phoneNumber ?? '',
            address: event!.meetingDetails?.address ?? '',
            interviewerIds: event!.interviewerIds,
          },
          onConfirm: handleEdit,
        }
      : {
          mode: 'create' as const,
          candidateName: selectedCandidate
            ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
            : '',
          candidates: candidatesForJob.map(c => ({
            _id: c.candidateId,
            firstName: c.firstName,
            lastName: c.lastName,
          })),
          candidateId: selectedCandidateId,
          onCandidateChange: setSelectedCandidateId,
          job: selectedJob,
          // The candidate list is scoped to the job, so switching jobs must drop
          // any previously chosen candidate — otherwise the picker holds an id
          // that is no longer among its options.
          onJobChange: (nextJobId: string) => {
            setSelectedJobId(nextJobId);
            setSelectedCandidateId('');
          },
          initial: undefined,
          onConfirm: handleCreate,
        };

    return (
      <ScheduleInterviewDialog
        open
        onClose={() => {
          setEditing(false);
          onOpenChange(false);
        }}
        loading={saving}
        jobs={openJobs.map(j => ({ _id: j._id, title: j.title }))}
        users={users}
        defaultDate={defaultDate ?? fallbackDate}
        {...dialogProps}
      />
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle>{title}</SheetTitle>
          {event && (
            <SheetDescription>
              {getInterviewStartTime(event.scheduledAt, event.timezone)} ·{' '}
              {event.duration} min
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="pt-4 flex-1 overflow-y-auto">
          {event && (
            <EventDetail
              event={event}
              candidateName={candidateName}
              jobTitle={jobTitle}
              interviewerNames={interviewerNames}
              onEdit={() => setEditing(true)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
