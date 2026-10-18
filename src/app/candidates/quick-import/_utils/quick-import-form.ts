import { applicantFieldsSchema } from '@/components/candidate-form/applicant-schema';
import { z } from 'zod';

export const quickImportSchema = applicantFieldsSchema.extend({
  jobId: z.string().min(1, 'Job assignment is required'),
  videoIntroUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type QuickImportValues = z.infer<typeof quickImportSchema>;

export interface JobOption {
  _id: string;
  title: string;
  clientName: string;
}
