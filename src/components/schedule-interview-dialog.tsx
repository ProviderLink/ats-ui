import { TimezoneSelect } from '@/components/timezone-select';
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
import { DEFAULT_TIMEZONE } from '@/lib/timezones';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/slices/settings.store';
import {
  INTERVIEW_MEETING_TYPE_LABELS,
  type InterviewMeetingType,
  type Job,
} from '@/store/types';
import { AlertTriangleIcon, CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface ScheduleInterviewInput {
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
}

/**
 * Default start: the next whole hour. Computed as initial state rather than
 * assigned in an effect so the form is correct on first paint.
 */
function nextHourDefaults() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return {
    date: now.toISOString().slice(0, 10),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}

/**
 * Schedule an interview against a candidate's application.
 *
 * Extracted from the candidate detail sheet so the candidates table can offer
 * scheduling from a row without duplicating this form. Pure: it owns only its
 * own field state and reports the collected values via `onConfirm`.
 *
 * The caller must render this only while open (or key it) — the field state is
 * seeded from initial state and never reset by an effect.
 */
export function ScheduleInterviewDialog({
  open,
  onClose,
  onConfirm,
  candidateName,
  job,
  jobs,
  users,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ScheduleInterviewInput) => void;
  candidateName: string;
  job: Job | null;
  jobs: { _id: string; title: string }[];
  users: { _id: string; firstName: string; lastName: string }[];
  loading?: boolean;
}) {
  const [title, setTitle] = useState(
    () => `Interview - ${candidateName} for ${job?.title ?? 'this job'}`
  );
  const [type, setType] = useState('zoom');
  const [interviewType, setInterviewType] =
    useState<InterviewMeetingType>('initial_screening');
  const [jobId, setJobId] = useState(() => job?._id ?? '');
  const [round, setRound] = useState(1);
  const [date, setDate] = useState(() => nextHourDefaults().date);
  const [time, setTime] = useState(() => nextHourDefaults().time);
  const [duration, setDuration] = useState(45);
  const settings = useSettingsStore(s => s.settings);
  const defaultTz = settings?.companyTimezone || DEFAULT_TIMEZONE;
  const [timezone, setTimezone] = useState(defaultTz);
  const [interviewerIds, setInterviewerIds] = useState<string[]>([]);
  const [meetingLink, setMeetingLink] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [typeSearch, setTypeSearch] = useState('');

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    if (job) map.set(job._id, job.title);
    for (const j of jobs) map.set(j._id, j.title);
    return Array.from(map.entries()).map(([_id, title]) => ({ _id, title }));
  }, [jobs, job]);

  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    const entries = Object.entries(INTERVIEW_MEETING_TYPE_LABELS) as [
      InterviewMeetingType,
      string,
    ][];
    if (!q) return entries;
    return entries.filter(([, label]) => label.toLowerCase().includes(q));
  }, [typeSearch]);

  const scheduledAt = date && time ? `${date}T${time}:00` : '';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for{' '}
            <span className="font-medium">{candidateName}</span>
            {job && (
              <>
                {' '}
                for <span className="font-medium">{job.title}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-4 flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="col-span-4 flex flex-col gap-1.5">
            <Label>Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Interview Type</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal text-sm"
                >
                  <span className="truncate">
                    {INTERVIEW_MEETING_TYPE_LABELS[interviewType] ??
                      interviewType}
                  </span>
                  <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <div className="flex flex-col gap-0.5 p-1 max-h-60 overflow-y-auto">
                  <Input
                    placeholder="Search interview type…"
                    value={typeSearch}
                    onChange={e => setTypeSearch(e.target.value)}
                    className="h-8 text-sm mb-1"
                    autoFocus
                  />
                  <Separator />
                  {filteredTypes.map(([t, label]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setInterviewType(t);
                        setTypeSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors',
                        interviewType === t && 'bg-primary/10 text-primary'
                      )}
                    >
                      {interviewType === t ? (
                        <CheckIcon className="size-3.5 shrink-0" />
                      ) : (
                        <span className="size-3.5 shrink-0" />
                      )}
                      {label}
                    </button>
                  ))}
                  {filteredTypes.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                      No matching interview type
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
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
          <div className="flex flex-col gap-1.5">
            <Label>Round</Label>
            <Input
              type="number"
              min={1}
              value={round}
              onChange={e => setRound(Number(e.target.value) || 1)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Duration (min)</Label>
            <Input
              type="number"
              min={15}
              max={480}
              step={15}
              value={duration}
              onChange={e => setDuration(Number(e.target.value) || 45)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Timezone</Label>
            <TimezoneSelect value={timezone} onValueChange={setTimezone} />
          </div>
        </div>

        {(type === 'zoom' || type === 'google_meet') && (
          <div className="flex flex-col gap-1.5 mt-3">
            <Label>
              Meeting Link{type !== 'google_meet' && ' (optional)'}
              {type === 'google_meet' && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </Label>
            <Input
              placeholder={
                type === 'google_meet'
                  ? 'https://meet.google.com/...'
                  : 'https://zoom.us/j/...'
              }
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              required={type === 'google_meet'}
            />
          </div>
        )}

        {type === 'google_meet' && (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 mt-3">
            <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
        {type === 'phone_call' && (
          <div className="flex flex-col gap-1.5 mt-3">
            <Label>Phone Number</Label>
            <Input
              placeholder="+1 555-123-4567"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
            />
          </div>
        )}
        {type === 'in_person' && (
          <div className="flex flex-col gap-1.5 mt-3">
            <Label>Address</Label>
            <Input
              placeholder="123 Main St, New York, NY"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 mt-3">
          <Label>
            Interviewers
            {interviewerIds.length > 0 && (
              <span className="text-muted-foreground font-normal">
                {' '}
                ({interviewerIds.length} selected)
              </span>
            )}
          </Label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {users.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center w-full">
                No users available
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
                </button>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !title || !date || !time || interviewerIds.length === 0 || loading
            }
            onClick={() =>
              onConfirm({
                title,
                type,
                interviewType,
                jobId,
                round,
                scheduledAt,
                duration,
                timezone,
                interviewerIds,
                meetingLink,
                phoneNumber,
                address,
              })
            }
          >
            {loading ? 'Scheduling…' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
