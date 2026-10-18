import { applicantFieldsSchema } from '@/components/candidate-form/applicant-schema';
import type { CandidateParsedData } from '@/store/types';
import { z } from 'zod';

export interface ResumeUploadResult {
  resumeOriginalName: string;
  resumeRawText: string;
  parsedData: CandidateParsedData | null;
}

export const applySchema = applicantFieldsSchema.extend({
  videoIntroUrl: z.string().min(1, 'Required').url('Must be a valid URL'),
  portfolioUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type ApplyFormValues = z.infer<typeof applySchema>;
