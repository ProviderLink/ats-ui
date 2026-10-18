import { z } from 'zod';

export const applicantFieldsSchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().min(1, 'Required').email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  yearsOfExperience: z
    .number({ error: 'Enter a number' })
    .min(0, 'Must be 0 or more'),
  englishProficiency: z.enum([
    'basic',
    'conversational',
    'professional',
    'fluent',
    'native',
  ]),
  currentSalaryPHP: z.number().min(0, 'Must be 0 or more').optional(),
  currentSalaryUSD: z.number().min(0, 'Must be 0 or more').optional(),
  reasonForLeaving: z.string().max(500).optional(),
  cityOfResidence: z.string().min(1, 'Required').max(100),
});

export type ApplicantFieldsValues = z.infer<typeof applicantFieldsSchema>;
