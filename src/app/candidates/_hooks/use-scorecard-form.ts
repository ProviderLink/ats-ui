import { useAuthStore } from '@/store/slices/auth.store';
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
  const currentUser = useAuthStore(s => s.user);

  const form = useForm<ScorecardFormValues>({
    resolver: zodResolver(scorecardSchema),
    defaultValues: defaultScorecardValues(
      defaultJobId ?? '',
      currentUser?._id ?? ''
    ),
  });
  const { reset, setValue, control } = form;

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
        const payload: UpdateInterviewScorecardDto = {
          interviewerId: values.interviewerId,
          ...fields,
        };
        await update(editing._id, payload);
      } else {
        const payload: CreateInterviewScorecardDto = {
          candidateId,
          jobId: values.jobId,
          interviewerId: values.interviewerId,
          ...fields,
        };
        await create(payload);
      }
      onClose();
      reset();
      onCreated?.();
    } catch {
      // The store reports the failure.
    }
  };

  return { form, previewScores, mutating, onSubmit };
}
