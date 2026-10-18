import { applicantFormData } from '@/components/candidate-form/applicant-form-data';
import {
  IMAGE_PDF_MESSAGE,
  isImageOnlyPdfError,
  waitForMinParseDuration,
} from '@/components/candidate-form/resume-parse';
import {
  EMPTY_REVIEW,
  reviewFromParsed,
  type ReviewData,
} from '@/components/candidate-form/review-data';
import { postForm, postJson } from '@/lib/api-client';
import type { Job } from '@/store';
import type { CandidateParsedData } from '@/store/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { quickImportSchema, type QuickImportValues } from './quick-import-form';

export type QuickImportStep = 'input' | 'parsing' | 'review' | 'importing';

export function useQuickImportFlow(presetJobId: string, allJobs: Job[]) {
  const [step, setStep] = useState<QuickImportStep>('input');
  const [resumeFile, setResumeFileState] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<QuickImportValues | null>(
    null
  );
  const [reviewData, setReviewData] = useState<ReviewData>(EMPTY_REVIEW);

  const form = useForm<QuickImportValues>({
    resolver: zodResolver(quickImportSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yearsOfExperience: 0,
      jobId: presetJobId,
      videoIntroUrl: '',
      currentSalaryPHP: undefined,
      currentSalaryUSD: undefined,
      reasonForLeaving: '',
      cityOfResidence: '',
    },
  });

  function setResumeFile(file: File | null) {
    setResumeFileState(file);
    if (file) setResumeError(null);
  }

  async function parseResume(values: QuickImportValues) {
    if (!resumeFile) {
      setResumeError('Resume file is required');
      return;
    }
    setResumeError(null);
    const startedAt = Date.now();
    setInputValues(values);
    setStep('parsing');

    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      // Stateless parse — no candidate is created yet. The candidate is only
      // persisted on "Import" so abandoned uploads never leave orphan records.
      const parsedData = await postForm<CandidateParsedData | null>(
        '/ats/candidates/public/parse',
        formData
      );
      if (!parsedData) {
        toast.warning(
          'AI parsing did not return any data. You can fill the details manually below.'
        );
      }
      setReviewData(reviewFromParsed(parsedData));
      setStep('review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      if (isImageOnlyPdfError(message)) {
        await waitForMinParseDuration(startedAt);
        setResumeFileState(null);
        setResumeError(IMAGE_PDF_MESSAGE);
        setStep('input');
        return;
      }
      toast.error(message);
      setStep('input');
    }
  }

  async function importCandidate() {
    if (!resumeFile || !inputValues) return;
    setStep('importing');

    try {
      const formData = applicantFormData(inputValues);
      formData.append('parsedData', JSON.stringify(reviewData));
      formData.append('file', resumeFile);

      const created = await postForm<{ _id: string }>(
        '/ats/candidates',
        formData
      );
      await postJson(`/ats/candidates/${created._id}/assign-job`, {
        jobId: inputValues.jobId,
      });

      const job = allJobs.find(j => j._id === inputValues.jobId);
      toast.success(
        `Candidate ${inputValues.firstName} ${inputValues.lastName} imported and assigned to ${job?.title ?? inputValues.jobId}`
      );

      form.reset();
      setResumeFileState(null);
      cancelReview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
      setStep('review');
    }
  }

  function cancelReview() {
    setInputValues(null);
    setReviewData(EMPTY_REVIEW);
    setStep('input');
  }

  return {
    step,
    form,
    resumeFile,
    setResumeFile,
    resumeError,
    inputValues,
    reviewData,
    setReviewData,
    parseResume,
    importCandidate,
    cancelReview,
  };
}
