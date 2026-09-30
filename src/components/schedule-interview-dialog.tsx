import { TimezoneSelect } from '@/components/timezone-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { DEFAULT_TIMEZONE, getZonedDate, getZonedTime } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/auth.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Job } from '@/store/types';
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export interface ScheduleInterviewInput {
  title: string;
  type: string;
  jobId: string;
  scheduledAt: string;
  interviewerIds: string[];
  meetingLink: string;
  phoneNumber: string;
  address: string;
}

export interface ScheduleCandidateOption {
  _id: string;
  firstName: string;
  lastName: string;
}

/** Pre-filled values for the edit flow. Dates are wall clocks in company TZ. */
export interface ScheduleInterviewInitial {
  title: string;
  type: string;
  jobId?: string;
  date: string;
  time: string;
  meetingLink: string;
  phoneNumber: string;
  address: string;
  interviewerIds: string[];
}

export type ScheduleInterviewMode = 'create' | 'edit';

/**
 * Default start: the next whole hour **on the wall clock of `timezone`**.
 *
 * Two traps this avoids:
 * 1. Deriving the date from `toISOString()` mixed a UTC day with a local clock,
 *    so west of UTC the form pre-filled TOMORROW (e.g. Chicago 19:30 → 01:00Z
 *    the next day).
 * 2. The defaults are submitted through `zonedWallClockToUtc(..., timezone)`,
 *    which reads them as a wall clock in the SELECTED zone — not in the
 *    browser's. Building them from browser-local getters therefore shifted the
 *    time by the difference between the two zones.
 */
function nextHourDefaults(timezone: string) {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  const date = getZonedDate(nextHour.toISOString(), timezone);
  const time = getZonedTime(nextHour.toISOString(), timezone);
  return {
    date,
    // Round down to the hour, keeping the zone's own date (so 23:xx local in a
    // zone that has already rolled over still gets that zone's next day).
    time: time ? `${time.slice(0, 2)}:00` : '',
  };
}

/**
 * The one and only interview scheduling form.
 *
 * Used by the candidates table, the candidate detail sheet, and the calendar's
 * "New Event" sheet. The calendar previously had its own diverging copy that
 * asked for different fields; keeping a single component is what guarantees
 * "the same form everywhere".
 *
 * Deliberately does NOT collect:
 * - **Round** — interviews are not numbered.
 * - **Stage / interviewType** — removed from the product.
 * - **Duration** — a fixed value is applied server-side.
 * - **Timezone** — always the company timezone from Settings. It is *shown*
 *   (read-only) so the user can see which clock the times refer to.
 *
 * The caller must render this only while open (or key it) — the field state is
 * seeded from initial state and never reset by an effect.
 */
export function ScheduleInterviewDialog({
  open,
  onClose,
  onConfirm,
  candidateName,
  candidates,
  candidateId,
  onCandidateChange,
  job,
  jobs,
  onJobChange,
  users,
  loading,
  mode = 'create',
  initial,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ScheduleInterviewInput) => void;
  candidateName: string;
  /**
   * When provided, the form renders a candidate picker (the calendar has no
   * candidate in context — it schedules from a day cell). When omitted, the
   * candidate is fixed by the caller.
   */
  candidates?: ScheduleCandidateOption[];
  /**
   * Id of the currently selected candidate. MUST be the id, not the display
   * name: Radix `SelectItem` values are ids, so a name never matches and the
   * trigger silently keeps showing its placeholder.
   */
  candidateId?: string;
  onCandidateChange?: (candidateId: string) => void;
  job: Job | null;
  jobs: { _id: string; title: string }[];
  /** Only used in the calendar flow, where the job is not known up front. */
  onJobChange?: (jobId: string) => void;
  users: { _id: string; firstName: string; lastName: string }[];
  loading?: boolean;
  mode?: ScheduleInterviewMode;
  /** Required when `mode` is `edit`. */
  initial?: ScheduleInterviewInitial;
  /**
   * Pre-fills the date field. Used by the calendar, which is opened from a
   * specific day cell. `YYYY-MM-DD`, interpreted in the company timezone.
   */
  defaultDate?: string;
}) {
  const currentUser = useAuthStore(s => s.user);
  const settings = useSettingsStore(s => s.settings);
  const timezone = settings?.companyTimezone || DEFAULT_TIMEZONE;
  const isEdit = mode === 'edit';

  /**
   * Title is a DERIVED suggestion with an override.
   *
   * Seeding it with `useState` froze the value at mount, so in the calendar flow
   * — where the candidate is chosen AFTER the form opens — the title kept saying
   * "for this job" and never named the candidate. Deriving it means it tracks the
   * selection, while an explicit edit still wins.
   */
  const [titleOverride, setTitleOverride] = useState<string | null>(
    () => initial?.title ?? null
  );
  const title =
    titleOverride ??
    `Interview - ${candidateName || 'Candidate'} for ${job?.title ?? 'this job'}`;
  const [type, setType] = useState(() => initial?.type ?? 'zoom');
  const [jobId, setJobId] = useState(() => initial?.jobId ?? job?._id ?? '');
  const { date: hourDate, time: defaultTime } = nextHourDefaults(timezone);
  const [date, setDate] = useState(
    () => initial?.date ?? defaultDate ?? hourDate
  );
  const [time, setTime] = useState(() => initial?.time ?? defaultTime);
  // The organiser is the implicit interviewer, so the field starts pre-filled
  // instead of empty — an empty list used to block the Schedule button.
  const [interviewerIds, setInterviewerIds] = useState<string[]>(() =>
    initial ? initial.interviewerIds : currentUser?._id ? [currentUser._id] : []
  );
  const [meetingLink, setMeetingLink] = useState(
    () => initial?.meetingLink ?? ''
  );
  const [phoneNumber, setPhoneNumber] = useState(
    () => initial?.phoneNumber ?? ''
  );
  const [address, setAddress] = useState(() => initial?.address ?? '');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    if (job) map.set(job._id, job.title);
    for (const j of jobs) map.set(j._id, j.title);
    return Array.from(map.entries()).map(([_id, title]) => ({ _id, title }));
  }, [jobs, job]);

  const scheduledAt = date && time ? `${date}T${time}:00` : '';
  const showCandidatePicker = candidates !== undefined;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Interview' : 'Schedule Interview'}
          </DialogTitle>
          <DialogDescription>
            {showCandidatePicker ? (
              <>
                Book an interview for a candidate on{' '}
                <span className="font-medium">
                  {job?.title ?? 'the selected job'}
                </span>
                .
              </>
            ) : (
              <>
                Schedule an interview for{' '}
                <span className="font-medium">{candidateName}</span>
                {job && (
                  <>
                    {' '}
                    for <span className="font-medium">{job.title}</span>
                  </>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {showCandidatePicker && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Job *</Label>
                <Select
                  value={jobId}
                  onValueChange={v => {
                    setJobId(v);
                    onJobChange?.(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select job…" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobOptions.map(j => (
                      <SelectItem key={j._id} value={j._id}>
                        {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="si-candidate">Candidate *</Label>
                {candidates.length === 0 ? (
                  <p className="flex h-9 items-center text-xs text-muted-foreground">
                    {jobId ? 'No candidates on this job' : 'Select a job first'}
                  </p>
                ) : (
                  <Select
                    value={candidateId ?? ''}
                    onValueChange={v => onCandidateChange?.(v)}
                  >
                    <SelectTrigger id="si-candidate" className="w-full">
                      <SelectValue placeholder="Select candidate…" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map(c => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-when">Date</Label>
              <Input
                id="si-when"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-time">Start Time</Label>
              <Input
                id="si-time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>How</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom (link auto-created)</SelectItem>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'zoom' && (
            <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
              <CheckIcon className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">
                A Zoom meeting is created automatically and the link is sent to
                the candidate and interviewers.
              </p>
            </div>
          )}

          {(type === 'zoom' || type === 'google_meet') && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-link">
                Meeting Link
                {type === 'google_meet' && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>
              <Input
                id="si-link"
                placeholder={
                  type === 'google_meet'
                    ? 'https://meet.google.com/...'
                    : 'Leave blank to use the auto-created Zoom link'
                }
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                required={type === 'google_meet'}
              />
            </div>
          )}

          {type === 'google_meet' && (
            <div className="flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5">
              <AlertTriangleIcon className="size-4 text-warning shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs">
                <p className="font-medium text-warning">
                  Google Meet requires a manual link
                </p>
                <p className="text-muted-foreground">
                  <strong>Zoom</strong> interviews are auto-created via API — no
                  manual link needed. For <strong>Google Meet</strong>, create a
                  meeting at{' '}
                  <a
                    href="https://meet.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    meet.google.com
                  </a>{' '}
                  and paste the link above.
                </p>
              </div>
            </div>
          )}

          {type === 'phone_call' && (
            <div className="flex flex-col gap-1.5">
              <Label>Phone Number</Label>
              <Input
                placeholder="+1 555-123-4567"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          {type === 'in_person' && (
            <div className="flex flex-col gap-1.5">
              <Label>Address</Label>
              <Input
                placeholder="123 Main St, New York, NY"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Times are in</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {timezone.replace(/_/g, ' ')}
            </Badge>
            <span>— set in Settings</span>
          </div>
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start px-0 hover:bg-transparent text-muted-foreground"
            >
              <SlidersHorizontalIcon className="size-3.5" />
              More options
              <ChevronDownIcon
                className={cn(
                  'size-3.5 transition-transform',
                  advancedOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 pt-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-title">Title</Label>
              <Input
                id="si-title"
                value={title}
                onChange={e => setTitleOverride(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Interviewers
                <span className="text-muted-foreground font-normal">
                  {' '}
                  (optional — you are included by default)
                </span>
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center w-full">
                    No interviewers available
                  </p>
                ) : (
                  users.map(u => (
                    <button
                      key={u._id}
                      type="button"
                      aria-pressed={interviewerIds.includes(u._id)}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors cursor-pointer',
                        interviewerIds.includes(u._id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/30 border-muted text-muted-foreground hover:border-foreground/20'
                      )}
                      onClick={() =>
                        setInterviewerIds(prev =>
                          prev.includes(u._id)
                            ? prev.filter(id => id !== u._id)
                            : [...prev, u._id]
                        )
                      }
                    >
                      {interviewerIds.includes(u._id) && (
                        <CheckIcon className="size-3 shrink-0" />
                      )}
                      {u.firstName} {u.lastName}
                      {u._id === currentUser?._id && (
                        <span className="opacity-70">(you)</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="si-tz">Timezone</Label>
              <TimezoneSelect
                id="si-tz"
                value={timezone}
                onValueChange={() => {}}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Interviews always use the company timezone.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !date ||
              !time ||
              loading ||
              (showCandidatePicker && (!jobId || !candidateId))
            }
            onClick={() =>
              onConfirm({
                title,
                type,
                jobId,
                scheduledAt,
                interviewerIds,
                meetingLink,
                phoneNumber,
                address,
              })
            }
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
