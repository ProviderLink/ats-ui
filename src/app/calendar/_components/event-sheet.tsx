import { TimezoneSelect } from '@/components/timezone-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useClientStore } from '@/store/slices/clients.store';
import { useInterviewStore } from '@/store/slices/interviews.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import { useUserStore } from '@/store/slices/users.store';
import type {
  Interview,
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from '@/store/types';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ClockIcon,
  CopyIcon,
  InfoIcon,
  LinkIcon,
  Loader2Icon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  StarIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
        <span className="text-xs text-muted-foreground">
          Round {event.round}
        </span>
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
            {event.interviewerIds.map(id => (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs font-medium"
              >
                {interviewerNames[id] ?? id}
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
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="text-lg"
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
/*  EditForm — pre-filled update form                                  */
/* ------------------------------------------------------------------ */

interface EditFormData {
  title: string;
  type: InterviewType;
  round: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  timezone: string;
  meetingLink: string;
  phoneNumber: string;
  address: string;
  interviewerIds: string[];
}

function EditForm({
  event,
  users,
  onSave,
  onCancel: onCancelEdit,
}: {
  event: Interview;
  users: { _id: string; firstName: string; lastName: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const updateInterview = useInterviewStore(s => s.update);
  const m = event.meetingDetails;

  const [form, setForm] = useState<EditFormData>({
    title: event.title,
    type: event.type,
    round: String(event.round),
    scheduledDate: getZonedDate(event.scheduledAt, event.timezone),
    scheduledTime: getZonedTime(event.scheduledAt, event.timezone),
    duration: String(event.duration),
    timezone:
      event.timezone ||
      useSettingsStore.getState().settings?.companyTimezone ||
      DEFAULT_TIMEZONE,
    meetingLink: m?.link ?? '',
    phoneNumber: m?.phoneNumber ?? '',
    address: m?.address ?? '',
    interviewerIds: event.interviewerIds,
  });
  const [saving, setSaving] = useState(false);

  function set(field: keyof EditFormData, value: string | string[]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledDate) return;
    setSaving(true);
    try {
      // Interpret the typed date/time in the SELECTED zone, not the browser's.
      // `new Date("...").toISOString()` reads the wall clock as browser-local,
      // which is what made the timezone picker have no effect on the stored
      // instant.
      const scheduledAt = zonedWallClockToUtc(
        form.scheduledDate,
        form.scheduledTime,
        form.timezone
      );
      if (!scheduledAt) {
        toast.error('Please enter a valid date and time');
        setSaving(false);
        return;
      }

      const meetingDetails =
        form.meetingLink || form.phoneNumber || form.address
          ? {
              link: form.meetingLink || null,
              phoneNumber: form.phoneNumber || null,
              address: form.address || null,
            }
          : undefined;

      await updateInterview(event._id, {
        title: form.title,
        scheduledAt,
        duration: Number(form.duration) || 60,
        timezone: form.timezone,
        interviewerIds: form.interviewerIds,
        meetingDetails,
        // Type and Round are not accepted by the update schema yet, so zod
        // strips them and saving cannot change them. They are still sent so the
        // fields start persisting the moment the schema allows them; the form
        // currently renders both read-only so the UI does not promise an edit
        // that cannot happen.
        type: form.type,
        round: Number(form.round) || 1,
      });
      onSave();
    } catch {
      // toast handled by store
    } finally {
      setSaving(false);
    }
  }

  function toggleInterviewer(id: string) {
    setForm(prev => ({
      ...prev,
      interviewerIds: prev.interviewerIds.includes(id)
        ? prev.interviewerIds.filter(x => x !== id)
        : [...prev.interviewerIds, id],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ed-title">Title</Label>
        <Input
          id="ed-title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ed-type">Type</Label>
          {/*
            Read-only: the interview UPDATE schema does not accept `type` or
            `round`, so zod strips them and a save cannot change them. Showing
            live controls made "Save Changes" look like it worked while nothing
            changed. Re-enable both (plain Select/Input) once the backend
            update schema accepts them — the client already sends the values.
          */}
          <div
            id="ed-type"
            className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
          >
            {TYPE_LABELS[form.type] ?? form.type}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ed-round">Round</Label>
          <div
            id="ed-round"
            className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
          >
            {form.round}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ed-date">Date</Label>
        <Input
          id="ed-date"
          type="date"
          value={form.scheduledDate}
          onChange={e => set('scheduledDate', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ed-time">Start Time</Label>
          <Input
            id="ed-time"
            type="time"
            value={form.scheduledTime}
            onChange={e => set('scheduledTime', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ed-duration">Duration (min)</Label>
          <Input
            id="ed-duration"
            type="number"
            min={15}
            step={15}
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ed-tz">Timezone</Label>
        <TimezoneSelect
          id="ed-tz"
          value={form.timezone}
          onValueChange={v => set('timezone', v)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ed-link">Meeting Link (optional)</Label>
        <Input
          id="ed-link"
          value={form.meetingLink}
          onChange={e => set('meetingLink', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Interviewers</Label>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {users.map(u => (
            <button
              type="button"
              key={u._id}
              onClick={() => toggleInterviewer(u._id)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                form.interviewerIds.includes(u._id)
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/30 border-muted text-muted-foreground hover:border-foreground/20'
              )}
            >
              {u.firstName} {u.lastName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  CreateForm — new interview from calendar                           */
/* ------------------------------------------------------------------ */

interface CreateFormData {
  candidateId: string;
  jobId: string;
  title: string;
  type: InterviewType;
  round: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  timezone: string;
  meetingLink: string;
  phoneNumber: string;
  address: string;
  interviewerIds: string[];
}

function CreateForm({
  defaultDate,
  onSubmit,
}: {
  defaultDate: string;
  onSubmit: () => void;
}) {
  const createInterview = useInterviewStore(s => s.create);
  const candidates = useCandidateStore(s => s.items);
  const candidateDetail = useCandidateStore(s => s.detail);
  const fetchCandidates = useCandidateStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const applications = useApplicationStore(s => s.items);
  const fetchApplicationsScoped = useApplicationStore(s => s.fetchScoped);
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  const [form, setForm] = useState<CreateFormData>({
    candidateId: '',
    jobId: '',
    title: '',
    type: 'zoom',
    round: '1',
    scheduledDate: defaultDate,
    scheduledTime: '10:00',
    duration: '60',
    timezone:
      useSettingsStore.getState().settings?.companyTimezone || DEFAULT_TIMEZONE,
    meetingLink: '',
    phoneNumber: '',
    address: '',
    interviewerIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobPopoverOpen, setJobPopoverOpen] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const jobSearchInputRef = useRef<HTMLInputElement>(null);
  const fetchCandidateOne = useCandidateStore(s => s.fetchOne);

  useEffect(() => {
    fetchCandidates({ limit: 500 });
    if (jobs.length === 0) fetchJobs({ limit: 200 });
    if (users.length === 0) fetchUsers();
    if (clients.length === 0) fetchClients({ limit: 200 });
    // applications are fetched on-demand when a job is selected
  }, []);

  // When a job is selected, fetch its applications to discover candidate IDs,
  // then ensure those candidates are loaded in the local store.
  useEffect(() => {
    if (!form.jobId) return;
    setCandidatesLoading(true);
    // Scoped read — this sheet must not replace the shared applications list.
    fetchApplicationsScoped({ jobId: form.jobId, limit: 200 })
      .then(appItems => {
        // After applications load, backfill any candidates not yet in the store
        const currentCandidates = useCandidateStore.getState().items;
        const currentIds = new Set(currentCandidates.map(c => c._id));
        const scopedIds = appItems
          .filter(a => a.jobId === form.jobId)
          .map(a => a.candidateId)
          .filter(id => !currentIds.has(id));
        if (scopedIds.length > 0) {
          return Promise.allSettled(scopedIds.map(id => fetchCandidateOne(id)));
        }
      })
      .finally(() => {
        setCandidatesLoading(false);
      });
  }, [form.jobId, fetchApplicationsScoped, fetchCandidateOne]);

  const openJobs = useMemo(() => jobs.filter(j => j.status === 'open'), [jobs]);

  const clientNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clients) m[c._id] = c.companyName;
    return m;
  }, [clients]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.toLowerCase().trim();
    if (!q) return openJobs;
    return openJobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        (clientNameMap[j.clientId] ?? '').toLowerCase().includes(q)
    );
  }, [openJobs, jobSearch, clientNameMap]);

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === form.jobId),
    [jobs, form.jobId]
  );

  const jobCandidateIds = useMemo(() => {
    if (!form.jobId) return new Set<string>();
    return new Set(
      applications.filter(a => a.jobId === form.jobId).map(a => a.candidateId)
    );
  }, [applications, form.jobId]);

  const selectableCandidates = useMemo(() => {
    if (!form.jobId) return [];
    const fromItems = candidates.filter(c => jobCandidateIds.has(c._id));
    const itemIds = new Set(fromItems.map(c => c._id));
    // Backfill from detail for any candidates loaded individually
    const fromDetail: typeof candidates = [];
    for (const id of jobCandidateIds) {
      if (!itemIds.has(id) && candidateDetail[id]) {
        fromDetail.push(candidateDetail[id]);
      }
    }
    return [...fromItems, ...fromDetail];
  }, [candidates, candidateDetail, jobCandidateIds, form.jobId]);

  function findApplication() {
    return applications.find(
      a => a.candidateId === form.candidateId && a.jobId === form.jobId
    );
  }

  function set(field: keyof CreateFormData, value: string | string[]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleInterviewer(id: string) {
    setForm(prev => ({
      ...prev,
      interviewerIds: prev.interviewerIds.includes(id)
        ? prev.interviewerIds.filter(x => x !== id)
        : [...prev.interviewerIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const title =
      form.title ||
      (selectedCandidate
        ? `Interview - ${selectedCandidate.firstName} ${selectedCandidate.lastName}${selectedJob ? ` for ${selectedJob.title}` : ''}`
        : '');

    if (!title || !form.scheduledDate || !form.candidateId || !form.jobId)
      return;

    if (form.type === 'google_meet' && !form.meetingLink.trim()) {
      toast.error('Meeting link is required for Google Meet interviews');
      return;
    }

    const app = findApplication();
    if (!app) {
      toast.error('No application found for this candidate and job');
      return;
    }

    const job = jobs.find(j => j._id === form.jobId);
    if (!job) {
      toast.error('Job not found');
      return;
    }

    setSaving(true);
    try {
      // See the edit path above — the wall clock belongs to the selected zone.
      const scheduledAt = zonedWallClockToUtc(
        form.scheduledDate,
        form.scheduledTime,
        form.timezone
      );
      if (!scheduledAt) {
        toast.error('Please enter a valid date and time');
        setSaving(false);
        return;
      }

      const meetingDetails =
        form.meetingLink || form.phoneNumber || form.address
          ? {
              link: form.meetingLink || null,
              phoneNumber: form.phoneNumber || null,
              address: form.address || null,
            }
          : undefined;

      await createInterview({
        applicationId: app._id,
        candidateId: form.candidateId,
        jobId: form.jobId,
        clientId: job.clientId,
        title,
        type: form.type,
        round: Number(form.round) || 1,
        scheduledAt,
        duration: Number(form.duration) || 60,
        timezone: form.timezone,
        interviewerIds: form.interviewerIds,
        meetingDetails,
      });
      onSubmit();
    } catch {
      // toast handled by store
    } finally {
      setSaving(false);
    }
  }

  const selectedCandidate =
    candidates.find(c => c._id === form.candidateId) ||
    candidateDetail[form.candidateId] ||
    undefined;
  const matchedApp = form.candidateId && form.jobId ? findApplication() : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
      {/* Job selector — searchable combobox */}
      <div className="flex flex-col gap-2">
        <Label>Job *</Label>
        <Popover
          open={jobPopoverOpen}
          onOpenChange={v => {
            setJobPopoverOpen(v);
            if (!v) setJobSearch('');
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal h-9"
            >
              {selectedJob ? (
                <span className="text-left wrap-break-word">
                  {selectedJob.title}
                </span>
              ) : (
                <span className="text-muted-foreground">Select job...</span>
              )}
              <ChevronsUpDownIcon className="size-4 text-muted-foreground shrink-0 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) max-h-80 overflow-hidden flex flex-col p-0"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={e => {
              e.preventDefault();
              jobSearchInputRef.current?.focus();
            }}
          >
            <div className="flex items-center border-b px-3 shrink-0">
              <SearchIcon className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={jobSearchInputRef}
                className="flex h-9 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search by job or client..."
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-1">
              {filteredJobs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No job found.
                </p>
              ) : (
                filteredJobs.map(j => {
                  const isSelected = form.jobId === j._id;
                  return (
                    <button
                      key={j._id}
                      type="button"
                      onClick={() => {
                        set('jobId', j._id);
                        set('candidateId', '');
                        setJobPopoverOpen(false);
                        setJobSearch('');
                      }}
                      className={cn(
                        'flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <div className="flex items-start gap-1.5 w-full">
                        <span className="font-medium wrap-break-word text-left">
                          {j.title}
                        </span>
                        {isSelected && (
                          <CheckIcon className="size-3.5 shrink-0 mt-0.5 ml-auto" />
                        )}
                      </div>
                      {clientNameMap[j.clientId] && (
                        <span className="text-xs text-muted-foreground">
                          {clientNameMap[j.clientId]}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Candidate selector — filtered by selected job */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="ev-candidate">Candidate *</Label>
          {form.jobId && !candidatesLoading && (
            <span className="text-xs text-muted-foreground">
              {selectableCandidates.length} candidate
              {selectableCandidates.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Select
          value={form.candidateId}
          onValueChange={v => set('candidateId', v)}
          disabled={!form.jobId || candidatesLoading}
        >
          <SelectTrigger id="ev-candidate" className="w-full">
            {candidatesLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                Loading candidates...
              </span>
            ) : (
              <SelectValue
                placeholder={
                  form.jobId ? 'Select candidate...' : 'Select a job first'
                }
              />
            )}
          </SelectTrigger>
          <SelectContent>
            {selectableCandidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground px-2">
                {form.jobId
                  ? 'No candidates assigned to this job'
                  : 'Select a job to see candidates'}
              </p>
            ) : (
              selectableCandidates.slice(0, 50).map(c => (
                <SelectItem key={c._id} value={c._id}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {form.candidateId && form.jobId && (
        <div className="text-xs">
          {matchedApp ? (
            <span className="text-green-600 dark:text-green-400">
              ✓ Application found
            </span>
          ) : (
            <span className="text-destructive">
              ✗ No application — assign candidate to this job first
            </span>
          )}
        </div>
      )}

      {selectedCandidate && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-title">Title</Label>
          <Input
            id="ev-title"
            value={
              form.title ||
              `Interview - ${selectedCandidate.firstName} ${selectedCandidate.lastName}${selectedJob ? ` for ${selectedJob.title}` : ''}`
            }
            onChange={e => set('title', e.target.value)}
            required
          />
        </div>
      )}

      {!selectedCandidate && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-title">Title</Label>
          <Input
            id="ev-title"
            placeholder="e.g. Technical Interview"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-type">Type</Label>
          <Select
            value={form.type}
            onValueChange={v => set('type', v as InterviewType)}
          >
            <SelectTrigger id="ev-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="google_meet">Google Meet</SelectItem>
              <SelectItem value="phone_call">Phone Call</SelectItem>
              <SelectItem value="in_person">In Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-round">Round</Label>
          <Input
            id="ev-round"
            type="number"
            min={1}
            value={form.round}
            onChange={e => set('round', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-date">Date</Label>
        <Input
          id="ev-date"
          type="date"
          value={form.scheduledDate}
          onChange={e => set('scheduledDate', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-time">Start Time</Label>
          <Input
            id="ev-time"
            type="time"
            value={form.scheduledTime}
            onChange={e => set('scheduledTime', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ev-duration">Duration (min)</Label>
          <Input
            id="ev-duration"
            type="number"
            min={15}
            step={15}
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-tz">Timezone</Label>
        <TimezoneSelect
          id="ev-tz"
          value={form.timezone}
          onValueChange={v => set('timezone', v)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ev-link">
          Meeting Link{form.type !== 'google_meet' && ' (optional)'}
          {form.type === 'google_meet' && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </Label>
        <Input
          id="ev-link"
          placeholder="https://meet.google.com/..."
          value={form.meetingLink}
          onChange={e => set('meetingLink', e.target.value)}
          required={form.type === 'google_meet'}
        />
      </div>

      {form.type === 'google_meet' && (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <InfoIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-medium text-amber-800 dark:text-amber-300">
              Google Meet requires a manual link
            </p>
            <p className="text-amber-700/80 dark:text-amber-400/80">
              <strong>Zoom</strong> interviews are auto-created via API — no
              manual link needed. For <strong>Google Meet</strong>, create a
              meeting at{' '}
              <a
                href="https://meet.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
              >
                meet.google.com
              </a>{' '}
              and paste the link above.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Interviewers</Label>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {users.map(u => (
            <button
              type="button"
              key={u._id}
              onClick={() => toggleInterviewer(u._id)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                form.interviewerIds.includes(u._id)
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/30 border-muted text-muted-foreground hover:border-foreground/20'
              )}
            >
              {u.firstName} {u.lastName}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving || !matchedApp}
        className="mt-1 hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700"
      >
        {saving ? 'Scheduling...' : 'Schedule Interview'}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  EventSheet — top-level wrapper                                     */
/* ------------------------------------------------------------------ */

interface EventSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: Interview | null;
  defaultDate?: string;
  onMutate: () => void;
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
  const users = useUserStore(s => s.items);
  const fetchUsers = useUserStore(s => s.fetch);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setEditing(false);
      if (candidates.length === 0) fetchCandidates({ limit: 200 });
      if (jobs.length === 0) fetchJobs({ limit: 200 });
      if (users.length === 0) fetchUsers();
    }
  }, [open]);

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

  const title = event
    ? editing
      ? 'Edit Interview'
      : event.title
    : 'Schedule Interview';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle>{title}</SheetTitle>
          {event && !editing && (
            <SheetDescription>
              {getInterviewStartTime(event.scheduledAt, event.timezone)} ·{' '}
              {event.duration} min · Round {event.round}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="pt-4 flex-1 overflow-y-auto">
          {event && editing ? (
            <EditForm
              event={event}
              users={users}
              onSave={() => {
                setEditing(false);
                onMutate();
              }}
              onCancel={() => setEditing(false)}
            />
          ) : event ? (
            <EventDetail
              event={event}
              candidateName={candidateName}
              jobTitle={jobTitle}
              interviewerNames={interviewerNames}
              onEdit={() => setEditing(true)}
            />
          ) : (
            <CreateForm
              defaultDate={defaultDate ?? fallbackDate}
              onSubmit={() => {
                onMutate();
                onOpenChange(false);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
