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
import type { Job } from '@/store/types';
import { AdvancedOptions } from './schedule-interview/advanced-options';
import { InterviewLocationFields } from './schedule-interview/interview-location-fields';
import { InterviewTypeSelect } from './schedule-interview/interview-type-select';
import { JobCandidatePicker } from './schedule-interview/job-candidate-picker';
import type {
  ScheduleCandidateOption,
  ScheduleInterviewInitial,
  ScheduleInterviewInput,
  ScheduleInterviewMode,
} from './schedule-interview/schedule-interview-types';
import { useScheduleInterviewForm } from './schedule-interview/use-schedule-interview-form';
import { WhenFields } from './schedule-interview/when-fields';

interface ScheduleInterviewDialogProps {
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
}: ScheduleInterviewDialogProps) {
  const form = useScheduleInterviewForm({
    candidateName,
    job,
    jobs,
    initial,
    defaultDate,
  });
  const isEdit = mode === 'edit';
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
              jobId={form.jobId}
              jobOptions={form.jobOptions}
              onJobChange={v => {
                form.setJobId(v);
                onJobChange?.(v);
              }}
              candidates={candidates}
              candidateId={candidateId}
              onCandidateChange={onCandidateChange}
            />
          )}

          <WhenFields
            date={form.date}
            time={form.time}
            duration={form.duration}
            onDateChange={form.setDate}
            onTimeChange={form.setTime}
            onDurationChange={form.setDuration}
          />

          <InterviewTypeSelect value={form.type} onChange={form.setType} />

          <InterviewLocationFields
            type={form.type}
            meetingLink={form.meetingLink}
            onMeetingLinkChange={form.setMeetingLink}
            phoneNumber={form.phoneNumber}
            onPhoneNumberChange={form.setPhoneNumber}
            address={form.address}
            onAddressChange={form.setAddress}
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Times are in</span>
            <Badge variant="secondary" className="text-xs font-medium">
              {form.timezone.replace(/_/g, ' ')}
            </Badge>
            <span>— set in Settings</span>
          </div>
        </div>

        <AdvancedOptions
          title={form.title}
          onTitleChange={form.setTitleOverride}
          users={users}
          interviewerIds={form.interviewerIds}
          onInterviewerIdsChange={form.setInterviewerIds}
          currentUserId={form.currentUserId}
          timezone={form.timezone}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !form.date ||
              !form.time ||
              loading ||
              (showCandidatePicker && (!form.jobId || !candidateId))
            }
            onClick={() => onConfirm(form.input)}
          >
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
