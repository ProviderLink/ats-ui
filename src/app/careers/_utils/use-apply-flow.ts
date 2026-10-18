import { publicApi } from '@/lib/public-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  applicantFormData,
  applySchema,
  EMPTY_REVIEW,
  reviewFromParsed,
  type ApplyFormValues,
  type ResumeUploadResult,
  type ReviewData,
} from './apply-form';

export type ApplyStep = 'input' | 'parsing' | 'review' | 'submitting' | 'success';

// Keeps the parsing spinner on screen long enough that a rejection reads as
// a processing result instead of an instant snap back to the form.
const MIN_PARSE_DURATION_MS = 1200;

export function useApplyFlow(jobId: string | undefined) {
  const [step, setStep] = useState<ApplyStep>('input');
  const [resumeFile, setResumeFileState] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeUploadResult | null>(null);
  const [inputValues, setInputValues] = useState<ApplyFormValues | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData>(EMPTY_REVIEW);

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yearsOfExperience: 0,
      videoIntroUrl: '',
      portfolioUrl: '',
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

  async function parseResume(values: ApplyFormValues) {
    if (!resumeFile) {
      setResumeError('Resume file is required');
      return;
    }
    setResumeError(null);
    const startedAt = Date.now();
    setInputValues(values);
    setStep('parsing');

    const fd = applicantFormData(values);
    fd.append('file', resumeFile);

    try {
      const result = await publicApi.postForm<ResumeUploadResult>(
        '/ats/candidates/public/upload-and-parse',
        fd
      );
      setResumeData(result);
      if (!result.parsedData) {
        toast.warning(
          'AI parsing did not return any data. You can fill the details manually below.'
        );
      }
      setReviewData(reviewFromParsed(result.parsedData));
      setStep('review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      if (/image-based|scanned|text-based PDF/i.test(message)) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_PARSE_DURATION_MS) {
          await new Promise(resolve =>
            setTimeout(resolve, MIN_PARSE_DURATION_MS - elapsed)
          );
        }
        setResumeFileState(null);
        setResumeError(
          'This PDF appears to be image-based or scanned and cannot be parsed. Please upload a text-based PDF.'
        );
        setStep('input');
        return;
      }
      toast.error(message);
      setStep('input');
    }
  }

  async function submitApplication() {
    if (!resumeData || !inputValues || !jobId || !resumeFile) return;
    setStep('submitting');

    try {
      const fd = applicantFormData(inputValues);
      fd.append('resumeOriginalName', resumeData.resumeOriginalName);
      fd.append('resumeRawText', resumeData.resumeRawText);
      fd.append('parsedData', JSON.stringify(reviewData));
      fd.append('file', resumeFile);
      if (portfolioFile) fd.append('portfolioFile', portfolioFile);

      await publicApi.postForm(`/ats/jobs/${jobId}/apply`, fd);
      setStep('success');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
      setStep('review');
    }
  }

  function backToUpload() {
    setResumeData(null);
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
    portfolioFile,
    setPortfolioFile,
    inputValues,
    reviewData,
    setReviewData,
    parseResume,
    submitApplication,
    backToUpload,
  };
}
