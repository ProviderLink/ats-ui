import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type { Interview } from '@/store/types';
import { INTERVIEW_STATUS_LABELS } from '@/lib/interview-styles';
import {
  CalendarClockIcon,
  CircleAlertIcon,
  LinkIcon,
  PencilLineIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useCandidateInterviewOptions } from '../../_hooks/use-candidate-interview-options';
import {
  toDatetimeLocal,
  type ScorecardFormValues,
  type ScorecardJobOption,
} from '../../_utils/scorecard-form';
import { ScorecardField } from './scorecard-field';
import { SectionCard } from './section-card';

interface InterviewDetailsSectionProps {
  candidateId: string;
  open: boolean;
  jobOptions: ScorecardJobOption[];
  defaultJobId?: string | null;
  /** True when editing an existing scorecard (job and link are then fixed). */
  isEditing: boolean;
  /** `interviewId` of the scorecard being edited, if it was linked. */
  editingInterviewId?: string | null;
  /** Team members, used only to show names (interview panel, who wrote a scorecard). */
  interviewerOptions: { _id: string; name: string }[];
  /** Who wrote the scorecard being edited. */
  editingAuthorId?: string;
}

const formatWhen = (iso: string, timeZone?: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso));

function JobLabel({ job }: { job?: ScorecardJobOption }) {
  if (!job) return null;
  return (
    <span className="flex min-w-0 flex-col items-start leading-tight">
      <span className="truncate">{job.title}</span>
      {job.clientName && (
        <span className="truncate text-[11px] text-muted-foreground">
          {job.clientName}
        </span>
      )}
    </span>
  );
}

export function InterviewDetailsSection({
  candidateId,
  open,
  jobOptions,
  defaultJobId,
  isEditing,
  editingInterviewId,
  interviewerOptions,
  editingAuthorId,
}: InterviewDetailsSectionProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();
  const scorecards = useInterviewScorecardStore(s => s.items);
  const { interviews, loading } = useCandidateInterviewOptions(
    candidateId,
    open && !isEditing
  );
  const interviewId = useWatch({ control, name: 'interviewId' }) ?? '';
  const jobId = useWatch({ control, name: 'jobId' });

  const existingByInterview = useMemo(() => {
    const map = new Map<string, (typeof scorecards)[number]>();
    for (const sc of scorecards) {
      if (sc.interviewId && !map.has(sc.interviewId)) {
        map.set(sc.interviewId, sc);
      }
    }
    return map;
  }, [scorecards]);

  const nameOf = (id: string) =>
    interviewerOptions.find(o => o._id === id)?.name;
  const participantNames = (iv: Interview) =>
    iv.interviewerNames?.length
      ? iv.interviewerNames
      : iv.interviewerIds.map(id => nameOf(id) ?? 'Unknown');

  function chooseInterview(iv: Interview) {
    // Not marked dirty: picking (or auto-picking) an interview is not yet
    // entered work worth a leave-page warning.
    setValue('interviewId', iv._id);
    setValue('jobId', iv.jobId);
    setValue('interviewDate', toDatetimeLocal(iv.scheduledAt));
  }

  function chooseManual() {
    setValue('interviewId', '');
    if (!jobId && defaultJobId) setValue('jobId', defaultJobId);
  }

  // Pre-select the interview most likely being scored: the latest one that has
  // already happened and has no scorecard yet. Runs once, after the list loads.
  const autoSelected = useRef(false);
  useEffect(() => {
    if (isEditing || loading || autoSelected.current) return;
    autoSelected.current = true;
    if (interviews.length === 0) return;
    const now = Date.now();
    const pick =
      interviews.find(
        iv =>
          !existingByInterview.has(iv._id) &&
          new Date(iv.scheduledAt).getTime() <= now
      ) ??
      interviews.find(iv => !existingByInterview.has(iv._id)) ??
      interviews[0];
    chooseInterview(pick);
    // chooseInterview only reads values captured at this moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, loading, interviews, existingByInterview]);

  const job = jobOptions.find(j => j._id === jobId);
  const selected = interviews.find(iv => iv._id === interviewId);
  const selectedDuplicate = selected && existingByInterview.get(selected._id);
  const linked = isEditing ? !!editingInterviewId : !!selected;
  const showManual = isEditing ? !linked : !loading && interviewId === '';

  const jobSelect = (
    <ScorecardField
      label="Job"
      error={errors.jobId?.message}
      hint={isEditing ? 'The job is fixed once a scorecard is created.' : undefined}
      required
      className="@md:col-span-2"
    >
      <Controller
        control={control}
        name="jobId"
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={isEditing}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.jobId}>
              <SelectValue placeholder="Select job">
                {job && (
                  <span className="truncate">
                    {job.title}
                    {job.clientName && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {job.clientName}
                      </span>
                    )}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper">
              {jobOptions.map(j => (
                <SelectItem key={j._id} value={j._id}>
                  <JobLabel job={j} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </ScorecardField>
  );

  return (
    <SectionCard
      id="sc-interview"
      icon={CalendarClockIcon}
      title="Interview"
      subtitle={
        linked
          ? 'Scoring a scheduled interview'
          : 'Which interview is this scorecard for?'
      }
    >
      {!isEditing && loading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isEditing && !loading && interviews.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Interview"
          className="flex flex-col gap-2"
        >
          {interviews.map(iv => {
            const ivJob = jobOptions.find(j => j._id === iv.jobId);
            const existing = existingByInterview.get(iv._id);
            const active = iv._id === interviewId;
            const people = participantNames(iv);
            return (
              <button
                key={iv._id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseInterview(iv)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  active
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'bg-card hover:bg-muted/60'
                )}
              >
                <span
                  className={cn(
                    'mt-1 grid size-4 shrink-0 place-items-center rounded-full border',
                    active ? 'border-primary' : 'border-muted-foreground/40'
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-primary" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium">
                      {ivJob?.title ?? iv.title}
                    </span>
                    {ivJob?.clientName && (
                      <span className="truncate text-xs text-muted-foreground">
                        {ivJob.clientName}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatWhen(iv.scheduledAt, iv.timezone)}
                    {' · '}
                    {INTERVIEW_STATUS_LABELS[iv.status]}
                    {people.length > 0 && ` · ${people.join(', ')}`}
                  </span>
                </span>
                {existing && (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    Scorecard added
                  </Badge>
                )}
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={interviewId === ''}
            onClick={chooseManual}
            className={cn(
              'flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
              interviewId === ''
                ? 'border-primary/50 bg-primary/5 text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <PencilLineIcon className="size-4 shrink-0" />
            Other — not on the calendar, enter details manually
          </button>
        </div>
      )}

      {!isEditing && !loading && interviews.length === 0 && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          No scheduled interviews found for this candidate — enter the details
          manually.
        </p>
      )}

      {selectedDuplicate && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            A scorecard for this interview already exists
            {nameOf(selectedDuplicate.interviewerId)
              ? ` (by ${nameOf(selectedDuplicate.interviewerId)})`
              : ''}
            . You can still add another, for example from a second interviewer.
          </span>
        </div>
      )}

      {isEditing && editingAuthorId && nameOf(editingAuthorId) && (
        <p className="text-xs text-muted-foreground">
          Completed by {nameOf(editingAuthorId)}
        </p>
      )}

      {isEditing && linked && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LinkIcon className="size-3.5" />
          Linked to a scheduled interview — job and date can't be changed.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
        {(showManual || isEditing) && jobSelect}

        {(showManual || (isEditing && !linked)) && (
          <ScorecardField
            label="Interview date"
            error={errors.interviewDate?.message}
            required
          >
            <Input type="datetime-local" {...register('interviewDate')} />
          </ScorecardField>
        )}
      </div>
    </SectionCard>
  );
}
