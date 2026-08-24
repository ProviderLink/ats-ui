/**
 * Interview Scorecard entry form.
 *
 * Form pattern: React Hook Form + Zod (mirrors
 * `ats-ui/src/app/clients/_components/new-client-sheet.tsx` exactly).
 *
 * Live score preview: recomputed on every field change via RHF's
 * `useWatch`. Purely cosmetic — the server is the source of truth and
 * recomputes on save. The computed `*Weighted` / `overallScore` /
 * `communicationRating` fields are NEVER sent to the backend.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/auth.store';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import { useUserStore } from '@/store/slices/users.store';
import type {
  CreateInterviewScorecardDto,
  ExperienceSelection,
  FinalRecommendation,
  InterviewScorecardType,
} from '@/store/types/interview-scorecard.types';
import {
  CATEGORY_WEIGHTS,
  EXPERIENCE_SELECTIONS,
  EXPERIENCE_SELECTION_LABELS,
  FINAL_RECOMMENDATIONS,
  FINAL_RECOMMENDATION_LABELS,
  computeScorecardPreview,
} from '@/store/types/interview-scorecard.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClockIcon, Loader2Icon, StarIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const ratingField = z.number().int().min(1).max(5);

const scorecardSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  interviewerId: z.string().min(1, 'Interviewer is required'),
  interviewDate: z.string().min(1, 'Interview date is required'),
  // Category 1
  commEnglishDiction: ratingField,
  commEnglishComprehension: ratingField,
  // Category 2
  experienceSelections: z.array(z.enum(EXPERIENCE_SELECTIONS)).default([]),
  experienceRating: ratingField,
  // Category 3
  profPreparedOnTime: z.boolean(),
  profAppearanceDemeanor: z.boolean(),
  profAttitudeReliability: z.boolean(),
  profInterestInPosition: z.boolean(),
  professionalismRating: ratingField,
  // Category 4
  techInternetSpeed: z.boolean(),
  techHeadsetNoiseCancelling: z.boolean(),
  techTwoScreens: z.boolean(),
  techBackupInternet: z.boolean(),
  techBackupGenerator: z.boolean(),
  technologyRating: ratingField,
  // Category 5
  availUsHours: z.boolean(),
  availCompensationAcceptable: z.boolean(),
  availStartAvailability: z.boolean(),
  availOverallFit: z.boolean(),
  availabilityRating: ratingField,
  // Notes
  strengths: z.string().optional().default(''),
  concerns: z.string().optional().default(''),
  generalNotes: z.string().optional().default(''),
  recommendedPosition: z.string().optional().default(''),
  earliestStartDate: z.string().optional().nullable().default(null),
  compensationExpectation: z.string().optional().default(''),
  // Final recommendation — REQUIRED (blocks submit if empty)
  finalRecommendation: z.enum(FINAL_RECOMMENDATIONS, {
    message: 'Final recommendation is required',
  }),
});

type ScorecardFormValues = z.input<typeof scorecardSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  /** Pre-selected job id (e.g. the active pipeline application's job). */
  defaultJobId?: string | null;
  /** Allowed job choices (jobs scoped to this candidate's applications). */
  jobOptions: { _id: string; title: string }[];
  onCreated?: () => void;
}

const RECOMMENDATION_OPTIONS: FinalRecommendation[] = [
  'strongly_recommend',
  'recommend',
  'recommend_with_concerns',
  'hold_for_another_position',
  'do_not_recommend',
];

export function InterviewScorecardForm({
  open,
  onOpenChange,
  candidateId,
  defaultJobId,
  jobOptions,
  onCreated,
}: Props) {
  const create = useInterviewScorecardStore(s => s.create);
  const mutating = useInterviewScorecardStore(s => s.mutating);
  const currentUser = useAuthStore(s => s.user);
  const users = useUserStore(s => s.items);
  const usersLoading = useUserStore(s => s.loading);
  const fetchUsers = useUserStore(s => s.fetch);

  // Interviewer pool = users that have the `interviewer` role; plus the
  // current user (so an admin/recruiter can pick themselves too).
  const interviewerOptions = useMemo(() => {
    return users
      .filter(
        u => u.roles.includes('interviewer') || u._id === currentUser?._id
      )
      .map(u => ({ _id: u._id, name: `${u.firstName} ${u.lastName}` }));
  }, [users, currentUser]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ScorecardFormValues>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: {
      jobId: defaultJobId ?? '',
      interviewerId: currentUser?._id ?? '',
      interviewDate: new Date().toISOString().slice(0, 16), // <datetime-local>
      commEnglishDiction: 0,
      commEnglishComprehension: 0,
      experienceSelections: [],
      experienceRating: 0,
      profPreparedOnTime: false,
      profAppearanceDemeanor: false,
      profAttitudeReliability: false,
      profInterestInPosition: false,
      professionalismRating: 0,
      techInternetSpeed: false,
      techHeadsetNoiseCancelling: false,
      techTwoScreens: false,
      techBackupInternet: false,
      techBackupGenerator: false,
      technologyRating: 0,
      availUsHours: false,
      availCompensationAcceptable: false,
      availStartAvailability: false,
      availOverallFit: false,
      availabilityRating: 0,
      strengths: '',
      concerns: '',
      generalNotes: '',
      recommendedPosition: '',
      earliestStartDate: '',
      compensationExpectation: '',
      // finalRecommendation deliberately omitted → undefined → emits required error on submit
    },
  });

  // Ensure there are users in the store to populate the interviewer dropdown.
  useEffect(() => {
    if (open) void fetchUsers();
  }, [open, fetchUsers]);

  // Auto-populate the Job field with the candidate's active pipeline job
  // each time the sheet opens — still changeable via the select afterwards.
  useEffect(() => {
    if (open && defaultJobId) setValue('jobId', defaultJobId);
  }, [open, defaultJobId, setValue]);

  // Live UX preview — subscribed ONLY to the rating fields that feed the
  // score computation, so typing notes / picking a job doesn't re-render
  // the whole form (that churn was making the selects feel unresponsive).
  // Server recomputes on save and is the source of truth.
  const preview = useWatch({
    control,
    name: [
      'commEnglishDiction',
      'commEnglishComprehension',
      'experienceRating',
      'professionalismRating',
      'technologyRating',
      'availabilityRating',
    ],
  });
  const previewScores = useMemo(() => {
    const [
      commEnglishDiction,
      commEnglishComprehension,
      experienceRating,
      professionalismRating,
      technologyRating,
      availabilityRating,
    ] = preview;
    return computeScorecardPreview({
      commEnglishDiction: Number(commEnglishDiction ?? 0),
      commEnglishComprehension: Number(commEnglishComprehension ?? 0),
      experienceRating: Number(experienceRating ?? 0),
      professionalismRating: Number(professionalismRating ?? 0),
      technologyRating: Number(technologyRating ?? 0),
      availabilityRating: Number(availabilityRating ?? 0),
    });
  }, [preview]);

  const onSubmit = async (values: ScorecardFormValues) => {
    const payload: CreateInterviewScorecardDto = {
      candidateId,
      jobId: values.jobId,
      interviewerId: values.interviewerId,
      interviewDate: new Date(values.interviewDate).toISOString(),
      interviewType: 'initial_screening' as InterviewScorecardType,
      commEnglishDiction: Number(values.commEnglishDiction),
      commEnglishComprehension: Number(values.commEnglishComprehension),
      experienceSelections:
        (values.experienceSelections as ExperienceSelection[]) ?? [],
      experienceRating: Number(values.experienceRating),
      profPreparedOnTime: !!values.profPreparedOnTime,
      profAppearanceDemeanor: !!values.profAppearanceDemeanor,
      profAttitudeReliability: !!values.profAttitudeReliability,
      profInterestInPosition: !!values.profInterestInPosition,
      professionalismRating: Number(values.professionalismRating),
      techInternetSpeed: !!values.techInternetSpeed,
      techHeadsetNoiseCancelling: !!values.techHeadsetNoiseCancelling,
      techTwoScreens: !!values.techTwoScreens,
      techBackupInternet: !!values.techBackupInternet,
      techBackupGenerator: !!values.techBackupGenerator,
      technologyRating: Number(values.technologyRating),
      availUsHours: !!values.availUsHours,
      availCompensationAcceptable: !!values.availCompensationAcceptable,
      availStartAvailability: !!values.availStartAvailability,
      availOverallFit: !!values.availOverallFit,
      availabilityRating: Number(values.availabilityRating),
      strengths: values.strengths ?? '',
      concerns: values.concerns ?? '',
      generalNotes: values.generalNotes ?? '',
      recommendedPosition: values.recommendedPosition ?? '',
      earliestStartDate: values.earliestStartDate
        ? new Date(values.earliestStartDate).toISOString()
        : null,
      compensationExpectation: values.compensationExpectation ?? '',
      finalRecommendation: values.finalRecommendation,
    };
    try {
      await create(payload);
      onOpenChange(false);
      reset();
      onCreated?.();
    } catch {
      // toast handled by store
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex max-w-none! w-full sm:w-[60vw] min-w-95 flex-col gap-0 p-0"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle>New Interview Scorecard</SheetTitle>
          <SheetDescription>
            Rate the candidate across five categories. Overall score is computed
            automatically and finalized by the server on submit.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            {/* ── Header: job / interviewer / date ── */}
            <section className="flex flex-col gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Interview
              </Label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field
                  label="Job"
                  error={errors.jobId?.message}
                  hint={
                    defaultJobId
                      ? 'Auto-selected from the active pipeline job — change if needed.'
                      : undefined
                  }
                  required
                >
                  <Controller
                    control={control}
                    name="jobId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={!!errors.jobId}
                        >
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {jobOptions.map(j => (
                            <SelectItem key={j._id} value={j._id}>
                              <span className="flex items-center gap-2">
                                {j.title}
                                {j._id === defaultJobId && (
                                  <Badge
                                    variant="outline"
                                    className="h-4 border-primary/30 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                                  >
                                    Current
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field
                  label="Interviewer"
                  error={errors.interviewerId?.message}
                  required
                >
                  <Controller
                    control={control}
                    name="interviewerId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-invalid={!!errors.interviewerId}
                        >
                          <SelectValue
                            placeholder={
                              usersLoading
                                ? 'Loading interviewers…'
                                : 'Select interviewer'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {interviewerOptions.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              {usersLoading
                                ? 'Loading interviewers…'
                                : 'No interviewers available'}
                            </div>
                          ) : (
                            interviewerOptions.map(u => (
                              <SelectItem key={u._id} value={u._id}>
                                {u.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field
                  label="Interview date"
                  error={errors.interviewDate?.message}
                  required
                >
                  <Input type="datetime-local" {...register('interviewDate')} />
                </Field>
              </div>
            </section>

            <Separator />

            {/* ── Rating categories (2-up on wide screens) ── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* ── Category 1: Communication ── */}
              <CategorySection
                title="Communication"
                weight={CATEGORY_WEIGHTS.communication}
                weighted={previewScores.communicationWeighted}
              >
                <RatingRow
                  label="English Diction"
                  control={control}
                  name="commEnglishDiction"
                  error={
                    errors.commEnglishDiction?.message as string | undefined
                  }
                />
                <RatingRow
                  label="English Comprehension"
                  control={control}
                  name="commEnglishComprehension"
                  error={
                    errors.commEnglishComprehension?.message as
                      | string
                      | undefined
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Communication rating:{' '}
                  <span className="font-medium text-foreground">
                    {previewScores.communicationRating}/5
                  </span>{' '}
                  (auto-computed from the two sub-ratings above)
                </p>
              </CategorySection>

              {/* ── Category 2: Relevant Experience ── */}
              <CategorySection
                title="Relevant Experience"
                weight={CATEGORY_WEIGHTS.experience}
                weighted={previewScores.experienceWeighted}
              >
                <div className="flex flex-col gap-2">
                  <Label>Relevant experience areas (informational)</Label>
                  <Controller
                    control={control}
                    name="experienceSelections"
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        {EXPERIENCE_SELECTIONS.map(opt => {
                          const checked =
                            (
                              field.value as ExperienceSelection[] | undefined
                            )?.includes(opt) ?? false;
                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={c => {
                                  const next = new Set(
                                    (field.value as ExperienceSelection[]) ?? []
                                  );
                                  if (c) next.add(opt);
                                  else next.delete(opt);
                                  field.onChange(Array.from(next));
                                }}
                              />
                              {EXPERIENCE_SELECTION_LABELS[opt]}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
                <RatingRow
                  label="Experience rating"
                  control={control}
                  name="experienceRating"
                  error={errors.experienceRating?.message as string | undefined}
                />
              </CategorySection>

              {/* ── Category 3: Professionalism ── */}
              <CategorySection
                title="Professionalism"
                weight={CATEGORY_WEIGHTS.professionalism}
                weighted={previewScores.professionalismWeighted}
              >
                <div className="flex flex-col gap-2">
                  <BooleanRow
                    control={control}
                    name="profPreparedOnTime"
                    label="Prepared on time"
                  />
                  <BooleanRow
                    control={control}
                    name="profAppearanceDemeanor"
                    label="Appearance & demeanor"
                  />
                  <BooleanRow
                    control={control}
                    name="profAttitudeReliability"
                    label="Attitude & reliability"
                  />
                  <BooleanRow
                    control={control}
                    name="profInterestInPosition"
                    label="Interest in position"
                  />
                </div>
                <RatingRow
                  label="Professionalism rating"
                  control={control}
                  name="professionalismRating"
                  error={
                    errors.professionalismRating?.message as string | undefined
                  }
                />
              </CategorySection>

              {/* ── Category 4: Office & Technology Setup ── */}
              <CategorySection
                title="Office & Technology Setup"
                weight={CATEGORY_WEIGHTS.technology}
                weighted={previewScores.technologyWeighted}
              >
                <div className="flex flex-col gap-2">
                  <BooleanRow
                    control={control}
                    name="techInternetSpeed"
                    label="Internet speed adequate"
                  />
                  <BooleanRow
                    control={control}
                    name="techHeadsetNoiseCancelling"
                    label="Noise-cancelling headset"
                  />
                  <BooleanRow
                    control={control}
                    name="techTwoScreens"
                    label="Two screens"
                  />
                  <BooleanRow
                    control={control}
                    name="techBackupInternet"
                    label="Backup internet"
                  />
                  <BooleanRow
                    control={control}
                    name="techBackupGenerator"
                    label="Backup generator"
                  />
                </div>
                <RatingRow
                  label="Technology rating"
                  control={control}
                  name="technologyRating"
                  error={errors.technologyRating?.message as string | undefined}
                />
              </CategorySection>

              {/* ── Category 5: Availability & Overall Fit ── */}
              <CategorySection
                title="Availability & Overall Fit"
                weight={CATEGORY_WEIGHTS.availability}
                weighted={previewScores.availabilityWeighted}
              >
                <div className="flex flex-col gap-2">
                  <BooleanRow
                    control={control}
                    name="availUsHours"
                    label="Can work US hours"
                  />
                  <BooleanRow
                    control={control}
                    name="availCompensationAcceptable"
                    label="Compensation acceptable"
                  />
                  <BooleanRow
                    control={control}
                    name="availStartAvailability"
                    label="Start availability acceptable"
                  />
                  <BooleanRow
                    control={control}
                    name="availOverallFit"
                    label="Overall fit"
                  />
                </div>
                <RatingRow
                  label="Availability rating"
                  control={control}
                  name="availabilityRating"
                  error={
                    errors.availabilityRating?.message as string | undefined
                  }
                />
              </CategorySection>
            </div>

            <Separator />

            {/* ── Notes ── */}
            <section className="flex flex-col gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Notes
              </Label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Strengths">
                  <Textarea
                    className="resize-none"
                    rows={2}
                    {...register('strengths')}
                  />
                </Field>
                <Field label="Concerns">
                  <Textarea
                    className="resize-none"
                    rows={2}
                    {...register('concerns')}
                  />
                </Field>
                <Field label="General notes">
                  <Textarea
                    className="resize-none"
                    rows={2}
                    {...register('generalNotes')}
                  />
                </Field>
                <Field label="Recommended position">
                  <Input {...register('recommendedPosition')} />
                </Field>
                <Field label="Earliest start date">
                  <Input type="date" {...register('earliestStartDate')} />
                </Field>
                <Field label="Compensation expectation">
                  <Input {...register('compensationExpectation')} />
                </Field>
              </div>
            </section>

            <Separator />

            {/* ── Final recommendation (REQUIRED) ── */}
            <section className="flex flex-col gap-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Final Recommendation
                <span className="text-destructive"> *</span>
              </Label>
              <Controller
                control={control}
                name="finalRecommendation"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={v =>
                      field.onChange(v as FinalRecommendation)
                    }
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.finalRecommendation}
                    >
                      <SelectValue placeholder="Select a recommendation" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {RECOMMENDATION_OPTIONS.map(r => (
                        <SelectItem key={r} value={r}>
                          {FINAL_RECOMMENDATION_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.finalRecommendation && (
                <p className="text-xs text-destructive">
                  {errors.finalRecommendation.message}
                </p>
              )}
            </section>
          </div>

          {/* ── Sticky footer: live score preview + actions ── */}
          <SheetFooter className="shrink-0 flex-col items-stretch gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Overall score preview
              </span>
              <span className="text-sm font-semibold">
                {previewScores.overallScore.toFixed(1)}/100
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutating}>
                {mutating && (
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                )}
                Submit Scorecard
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Local UI helpers ─────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CategorySection({
  title,
  weight,
  weighted,
  children,
}: {
  title: string;
  weight: number;
  weighted: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            weight {weight}
          </span>
        </Label>
        <span className="text-xs text-muted-foreground">
          weighted:{' '}
          <span className="font-medium text-foreground">
            {weighted.toFixed(1)}
          </span>
          /{weight}
        </span>
      </div>
      {children}
    </section>
  );
}

function RatingRow({
  label,
  name,
  control,
  error,
}: {
  label: string;
  name:
    | `commEnglishDiction`
    | `commEnglishComprehension`
    | `experienceRating`
    | `professionalismRating`
    | `technologyRating`
    | `availabilityRating`;
  control: ReturnType<typeof useForm<ScorecardFormValues>>['control'];
  error?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <ToggleGroup
              type="single"
              value={String(field.value ?? 0)}
              onValueChange={(v: string) => field.onChange(Number(v ?? 0))}
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map(i => (
                <ToggleGroupItem
                  key={i}
                  value={String(i)}
                  aria-label={`${i} star`}
                  className={cn(
                    'size-8 p-0',
                    Number(field.value ?? 0) >= i &&
                      'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700/40 dark:text-amber-300'
                  )}
                >
                  <StarIcon
                    className={cn(
                      'size-4',
                      Number(field.value ?? 0) >= i
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    )}
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}

function BooleanRow({
  label,
  name,
  control,
}: {
  label: string;
  name:
    | 'profPreparedOnTime'
    | 'profAppearanceDemeanor'
    | 'profAttitudeReliability'
    | 'profInterestInPosition'
    | 'techInternetSpeed'
    | 'techHeadsetNoiseCancelling'
    | 'techTwoScreens'
    | 'techBackupInternet'
    | 'techBackupGenerator'
    | 'availUsHours'
    | 'availCompensationAcceptable'
    | 'availStartAvailability'
    | 'availOverallFit';
  control: ReturnType<typeof useForm<ScorecardFormValues>>['control'];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!!field.value}
            onCheckedChange={c => field.onChange(!!c)}
          />
          {label}
        </label>
      )}
    />
  );
}
