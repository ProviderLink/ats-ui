import { WhenFields } from '@/components/schedule-interview/when-fields';
import { InterviewerPicker } from '@/components/schedule-interview/interviewer-picker';
import { nextHourDefaults } from '@/components/schedule-interview/next-hour-defaults';
import { MeetingTypeIcon } from '@/components/meeting-type-logo';
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
import { Textarea } from '@/components/ui/textarea';
import { EXTERNAL_MEETING_TYPE_LABELS } from '@/lib/external-meeting-styles';
import {
  getZonedDate,
  getZonedTime,
  zonedWallClockToUtc,
} from '@/lib/timezones';
import { withToast } from '@/lib/with-toast';
import { useAuthStore } from '@/store/slices/auth.store';
import { useExternalMeetingStore } from '@/store/slices/external-meetings.store';
import type { ExternalMeeting, ExternalMeetingType } from '@/store/types';
import { UserRoundIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const NO_JOB = '__none__';
const OTHER_JOB = 'Other';

interface ExternalMeetingDialogProps {
  /** Present → edit mode; absent → create. */
  event?: ExternalMeeting;
  users: { _id: string; firstName: string; lastName: string }[];
  /** Open ATS jobs, offered as an optional text label only. */
  jobOptions: { title: string; clientName: string | null }[];
  timezone: string;
  defaultDate: string;
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Create / edit an external meeting.
 *
 * The "Regarding" field is a plain text label (an open job's title or
 * "Other"). It is never linked to a job: nothing here creates an application
 * or touches a job pipeline. Render only while open — field state is seeded
 * once from props.
 */
export function ExternalMeetingDialog({
  event,
  users,
  jobOptions,
  timezone,
  defaultDate,
  onSaved,
  onClose,
}: ExternalMeetingDialogProps) {
  const isEdit = event !== undefined;
  const currentUserId = useAuthStore(s => s.user?._id);
  const create = useExternalMeetingStore(s => s.create);
  const update = useExternalMeetingStore(s => s.update);

  const { date: hourDate, time: hourTime } = nextHourDefaults(timezone);
  const [personName, setPersonName] = useState(event?.personName ?? '');
  const [personEmail, setPersonEmail] = useState(event?.personEmail ?? '');
  const [personPhone, setPersonPhone] = useState(event?.personPhone ?? '');
  const [jobLabel, setJobLabel] = useState(event?.jobLabel ?? NO_JOB);
  const [titleOverride, setTitleOverride] = useState(event?.title ?? '');
  const [type, setType] = useState<ExternalMeetingType>(event?.type ?? 'video');
  const [date, setDate] = useState(
    event
      ? getZonedDate(event.scheduledAt, event.timezone)
      : defaultDate || hourDate
  );
  const [time, setTime] = useState(
    event ? getZonedTime(event.scheduledAt, event.timezone) : hourTime
  );
  const [duration, setDuration] = useState(event?.duration ?? 60);
  const [link, setLink] = useState(event?.meetingDetails.link ?? '');
  const [phone, setPhone] = useState(event?.meetingDetails.phoneNumber ?? '');
  const [address, setAddress] = useState(event?.meetingDetails.address ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    () => event?.attendeeIds ?? (currentUserId ? [currentUserId] : [])
  );
  const [saving, setSaving] = useState(false);

  // The saved label is plain text: "Job — Client" (just "Job" without a
  // client). An edited meeting may carry a label that is no longer an open job.
  const labelOptions = jobOptions.map(j => ({
    value: j.clientName ? `${j.title} — ${j.clientName}` : j.title,
    title: j.title,
    clientName: j.clientName,
  }));
  if (
    event?.jobLabel &&
    event.jobLabel !== OTHER_JOB &&
    !labelOptions.some(o => o.value === event.jobLabel)
  ) {
    labelOptions.unshift({
      value: event.jobLabel,
      title: event.jobLabel,
      clientName: null,
    });
  }

  const trimmedName = personName.trim();
  const title =
    titleOverride.trim() || `Meeting with ${trimmedName || 'guest'}`;

  async function handleSave() {
    const scheduledAt = zonedWallClockToUtc(date, time, timezone);
    if (!scheduledAt) {
      toast.error('Please enter a valid date and time');
      return;
    }
    const payload = {
      title,
      personName: trimmedName,
      personEmail: personEmail.trim() || null,
      personPhone: personPhone.trim() || null,
      jobLabel: jobLabel === NO_JOB ? null : jobLabel,
      type,
      scheduledAt,
      duration,
      attendeeIds,
      meetingDetails: {
        link: type === 'video' ? link.trim() || null : null,
        phoneNumber: type === 'phone_call' ? phone.trim() || null : null,
        address: type === 'in_person' ? address.trim() || null : null,
      },
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      if (event) {
        await withToast('Meeting updated — notifications sent', () =>
          update(event._id, payload)
        );
      } else {
        await withToast('Meeting scheduled — invitations sent', () =>
          create(payload)
        );
      }
      onSaved();
    } catch {
      // withToast already reported the failure.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {isEdit ? 'Edit External Meeting' : 'New External Meeting'}
            </DialogTitle>
            <Badge
              variant="outline"
              className="gap-1 border-dashed border-teal-500 bg-teal-100 text-[10px] uppercase tracking-wide text-teal-900 dark:border-teal-500/50 dark:bg-teal-500/10 dark:text-teal-300"
            >
              <UserRoundIcon className="size-3" aria-hidden />
              External
            </Badge>
          </div>
          <DialogDescription>
            A meeting with someone who isn&apos;t in the ATS. It shows on the
            calendar only — no candidate or application is created.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-name">
                Name<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="em-name"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
                placeholder="Full name"
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-email">Email</Label>
              <Input
                id="em-email"
                type="email"
                value={personEmail}
                onChange={e => setPersonEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-phone">Phone</Label>
              <Input
                id="em-phone"
                value={personPhone}
                onChange={e => setPersonPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Regarding
              <span className="text-muted-foreground font-normal">
                {' '}
                (optional label — not linked to the job)
              </span>
            </Label>
            <Select value={jobLabel} onValueChange={setJobLabel}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {jobLabel === NO_JOB ? 'Not specified' : jobLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-64">
                <SelectItem value={NO_JOB}>Not specified</SelectItem>
                <SelectItem value={OTHER_JOB}>Other</SelectItem>
                {labelOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex flex-col items-start gap-0">
                      <span>{o.title}</span>
                      {o.clientName && (
                        <span className="text-xs text-muted-foreground">
                          {o.clientName}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <WhenFields
            date={date}
            time={time}
            duration={duration}
            onDateChange={setDate}
            onTimeChange={setTime}
            onDurationChange={setDuration}
          />

          <div className="flex flex-col gap-1.5">
            <Label>How</Label>
            <Select
              value={type}
              onValueChange={v => setType(v as ExternalMeetingType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXTERNAL_MEETING_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <MeetingTypeIcon type={value} />
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {type === 'video' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-link">Meeting Link</Label>
              <Input
                id="em-link"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="Leave blank to use our Zoom link, or paste your own"
              />
            </div>
          )}
          {type === 'phone_call' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-call">Phone Number to Call</Label>
              <Input
                id="em-call"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555-123-4567"
              />
            </div>
          )}
          {type === 'in_person' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="em-address">Address</Label>
              <Input
                id="em-address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main St, New York, NY"
              />
            </div>
          )}

          <InterviewerPicker
            label="Our team"
            users={users}
            selectedIds={attendeeIds}
            currentUserId={currentUserId}
            onChange={setAttendeeIds}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-title">Title</Label>
            <Input
              id="em-title"
              value={titleOverride}
              onChange={e => setTitleOverride(e.target.value)}
              placeholder={title}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="em-notes">Notes</Label>
            <Textarea
              id="em-notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional — visible to the team only"
              maxLength={2000}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Times are in</span>
            <Badge variant="secondary" className="text-xs font-medium border border-gray-300 bg-gray-200 text-gray-800 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground">
              {timezone.replace(/_/g, ' ')}
            </Badge>
            <span>— set in Settings</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!trimmedName || !date || !time || saving}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
