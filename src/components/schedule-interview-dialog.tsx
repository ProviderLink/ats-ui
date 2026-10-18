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
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/auth.store';
import { useSettingsStore } from '@/store/slices/settings.store';
import type { Job } from '@/store/types';
import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DurationSelect } from './schedule-interview/duration-select';
import { InterviewLocationFields } from './schedule-interview/interview-location-fields';
import { InterviewerPicker } from './schedule-interview/interviewer-picker';
import { JobCandidatePicker } from './schedule-interview/job-candidate-picker';
import { nextHourDefaults } from './schedule-interview/next-hour-defaults';
import {
  DEFAULT_DURATION,
  type ScheduleCandidateOption,
  type ScheduleInterviewInitial,
  type ScheduleInterviewInput,
  type ScheduleInterviewMode,
} from './schedule-interview/schedule-interview-types';

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
  const [duration, setDuration] = useState<number>(
    () => initial?.duration ?? DEFAULT_DURATION
  );
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
            <JobCandidatePicker
              jobId={jobId}
              jobOptions={jobOptions}
              onJobChange={v => {
                setJobId(v);
                onJobChange?.(v);
              }}
              candidates={candidates}
              candidateId={candidateId}
              onCandidateChange={onCandidateChange}
            />
          )}

          <div className="grid grid-cols-3 gap-3">
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
            <DurationSelect duration={duration} onChange={setDuration} />
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

          <InterviewLocationFields
            type={type}
            meetingLink={meetingLink}
            onMeetingLinkChange={setMeetingLink}
            phoneNumber={phoneNumber}
            onPhoneNumberChange={setPhoneNumber}
            address={address}
            onAddressChange={setAddress}
          />

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

            <InterviewerPicker
              users={users}
              selectedIds={interviewerIds}
              currentUserId={currentUser?._id}
              onChange={setInterviewerIds}
            />

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
                duration,
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
