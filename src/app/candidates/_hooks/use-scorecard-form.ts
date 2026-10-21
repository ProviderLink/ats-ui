import { withToast } from '@/lib/with-toast';
import { useInterviewScorecardStore } from '@/store/slices/interview-scorecards.store';
import type {
  CreateInterviewScorecardDto,
  InterviewScorecard,
  UpdateInterviewScorecardDto,
} from '@/store/types/interview-scorecard.types';
import { computeScorecardPreview } from '@/store/types/interview-scorecard.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  buildScorecardFields,
  defaultScorecardValues,
  scorecardSchema,
  toFormValues,
  type ScorecardFormValues,
} from '../_utils/scorecard-form';

interface UseScorecardFormOptions {
  open: boolean;
  candidateId: string;
  defaultJobId?: string | null;
  editing?: InterviewScorecard | null;
  onClose: () => void;
  onCreated?: () => void;
}

export function useScorecardForm({
  open,
  candidateId,
  defaultJobId,
  editing,
  onClose,
  onCreated,
}: UseScorecardFormOptions) {
  const create = useInterviewScorecardStore(s => s.create);
  const update = useInterviewScorecardStore(s => s.update);
  const mutating = useInterviewScorecardStore(s => s.mutating);

  const form = useForm<ScorecardFormValues>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: defaultScorecardValues(defaultJobId ?? ''),
  });
  const { reset, setValue, control } = form;
  const isDirty = form.formState.isDirty;

  // Reload or tab close with unsaved input: let the browser ask first.
  useEffect(() => {
    if (!open || !isDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [open, isDirty]);

  // Edit mode loads the existing scorecard; create mode resets to defaults and
  // auto-selects the active pipeline job (still changeable afterwards).
  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset(toFormValues(editing));
    } else {
      reset();
      if (defaultJobId) setValue('jobId', defaultJobId);
    }
  }, [open, editing, defaultJobId, reset, setValue]);

  // Subscribed ONLY to the rating fields that feed the score, so typing notes
  // or picking a job does not re-render the whole form. The server recomputes
  // on save and is the source of truth.
  const ratings = useWatch({
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
    ] = ratings;
    return computeScorecardPreview({
      commEnglishDiction: Number(commEnglishDiction ?? 0),
      commEnglishComprehension: Number(commEnglishComprehension ?? 0),
      experienceRating: Number(experienceRating ?? 0),
      professionalismRating: Number(professionalismRating ?? 0),
      technologyRating: Number(technologyRating ?? 0),
      availabilityRating: Number(availabilityRating ?? 0),
    });
  }, [ratings]);

  const onSubmit = async (values: ScorecardFormValues) => {
    const fields = buildScorecardFields(values);
    try {
      if (editing) {
        // No interviewerId: the server keeps the original author on edit.
        const payload: UpdateInterviewScorecardDto = fields;
        await withToast('Interview scorecard updated', () =>
          update(editing._id, payload)
        );
      } else {
        const payload: CreateInterviewScorecardDto = {
          candidateId,
          jobId: values.jobId,
          interviewId: values.interviewId || null,
          // No interviewerId: the server records the logged-in user.
          ...fields,
        };
        await withToast('Interview scorecard submitted', () => create(payload));
      }
      onClose();
      reset();
      onCreated?.();
    } catch {
      // withToast already reported the failure.
    }
  };

  return { form, previewScores, mutating, onSubmit };
}
