import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import { publicApi } from '@/lib/public-api';
import type { Job } from '@/store';
import type { CandidateParsedData } from '@/store/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  Loader2Icon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
  UploadIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

// --- Types ---

type ParsedExperience = {
  company: string;
  title: string;
  duration: string;
  description: string;
};

type ParsedEducation = {
  institution: string;
  degree: string;
  field: string;
  year: string;
};

type ReviewData = {
  summary: string;
  skills: string[];
  languages: string[];
  certifications: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
};

type CandidateApiResponse = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  parsedData: CandidateParsedData | null;
  resumeUrl: string;
  resumeOriginalName: string;
  resumeRawText?: string;
};

// --- Zod schema ---

const inputSchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().min(1, 'Required').email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  yearsOfExperience: z.number().min(0, 'Must be 0 or more'),
  videoIntroUrl: z.union([
    z.string().url('Must be a valid URL'),
    z.literal(''),
  ]),
  englishProficiency: z
    .enum(['basic', 'conversational', 'professional', 'fluent', 'native'])
    .optional(),
  currentSalaryPHP: z.number().min(0).optional(),
  currentSalaryUSD: z.number().min(0).optional(),
  reasonForLeaving: z.string().max(500).optional(),
  cityOfResidence: z.string().max(100).optional(),
});

type InputFormValues = z.infer<typeof inputSchema>;

// --- Shared components ---

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <button
                type="button"
                className="rounded-full hover:bg-muted"
                onClick={() => onChange(value.filter(t => t !== tag))}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? 'Type and press Enter or Add'}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <PlusIcon />
          Add
        </Button>
      </div>
    </div>
  );
}

function ExperienceEditor({
  entries,
  onChange,
}: {
  entries: ParsedExperience[];
  onChange: (entries: ParsedExperience[]) => void;
}) {
  function update(index: number, field: keyof ParsedExperience, val: string) {
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: val } : e)));
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <Card key={i} className="rounded-sm">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Experience {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Company">
                <Input
                  value={entry.company}
                  onChange={e => update(i, 'company', e.target.value)}
                />
              </Field>
              <Field label="Title">
                <Input
                  value={entry.title}
                  onChange={e => update(i, 'title', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Duration">
              <Input
                value={entry.duration}
                onChange={e => update(i, 'duration', e.target.value)}
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={entry.description}
                onChange={e => update(i, 'description', e.target.value)}
                className="resize-none"
              />
            </Field>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          onChange([
            ...entries,
            { company: '', title: '', duration: '', description: '' },
          ])
        }
      >
        <PlusIcon />
        Add Experience
      </Button>
    </div>
  );
}

function EducationEditor({
  entries,
  onChange,
}: {
  entries: ParsedEducation[];
  onChange: (entries: ParsedEducation[]) => void;
}) {
  function update(index: number, field: keyof ParsedEducation, val: string) {
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: val } : e)));
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <Card key={i} className="rounded-sm">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Education {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
              >
                <XIcon className="size-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Institution">
                <Input
                  value={entry.institution}
                  onChange={e => update(i, 'institution', e.target.value)}
                />
              </Field>
              <Field label="Degree">
                <Input
                  value={entry.degree}
                  onChange={e => update(i, 'degree', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Field of Study">
                <Input
                  value={entry.field}
                  onChange={e => update(i, 'field', e.target.value)}
                />
              </Field>
              <Field label="Year">
                <Input
                  value={entry.year}
                  onChange={e => update(i, 'year', e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          onChange([
            ...entries,
            { institution: '', degree: '', field: '', year: '' },
          ])
        }
      >
        <PlusIcon />
        Add Education
      </Button>
    </div>
  );
}

function JobSummaryCard({ job }: { job: Job }) {
  return (
    <Card className="rounded-sm">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Job summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Position</p>
          <p className="text-base font-medium text-foreground">{job.title}</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <UsersIcon className="size-4" />
              {job.openings} opening{job.openings === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {jobTypeLabel[job.jobType]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {locationTypeLabel[job.locationType]}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">
              {job.location ?? 'Remote'}
            </p>
          </div>
          {job.salaryRange && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Compensation</p>
              <p className="text-sm font-medium text-foreground">
                {formatSalary(job.salaryRange)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Step 1: Input form ---

function InputStep({
  job,
  form,
  resumeFile,
  setResumeFile,
  resumeError,
  onSubmit,
}: {
  job: Job;
  form: ReturnType<typeof useForm<InputFormValues>>;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  resumeError: string | null;
  onSubmit: (values: InputFormValues) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = form;

  const canSubmit = isValid && !!resumeFile;

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'application/pdf') setResumeFile(file);
    else toast.error('Please upload a PDF file');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') setResumeFile(file);
    else toast.error('Please upload a PDF file');
    e.target.value = '';
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="First Name"
                  required
                  error={errors.firstName?.message}
                >
                  <Input placeholder="e.g. Sarah" {...register('firstName')} />
                </Field>
                <Field
                  label="Last Name"
                  required
                  error={errors.lastName?.message}
                >
                  <Input
                    placeholder="e.g. Williams"
                    {...register('lastName')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Email" required error={errors.email?.message}>
                  <Input
                    type="email"
                    placeholder="candidate@email.com"
                    {...register('email')}
                  />
                </Field>
                <Field label="Phone" required error={errors.phone?.message}>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    {...register('phone')}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Years of Experience"
                  error={errors.yearsOfExperience?.message}
                >
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    className="w-full"
                    {...register('yearsOfExperience', { valueAsNumber: true })}
                  />
                </Field>

                <Field
                  label="English Proficiency"
                  error={errors.englishProficiency?.message}
                >
                  <Controller
                    control={control}
                    name="englishProficiency"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={v => field.onChange(v || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select level..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="conversational">
                            Conversational
                          </SelectItem>
                          <SelectItem value="professional">
                            Professional Working
                          </SelectItem>
                          <SelectItem value="fluent">Fluent</SelectItem>
                          <SelectItem value="native">
                            Native / Bilingual
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <Field
                label="City of Residence"
                error={errors.cityOfResidence?.message}
              >
                <Input
                  placeholder="e.g. Manila"
                  maxLength={100}
                  {...register('cityOfResidence')}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Current Salary (PHP)"
                  error={errors.currentSalaryPHP?.message}
                >
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    {...register('currentSalaryPHP', { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Current Salary (USD)"
                  error={errors.currentSalaryUSD?.message}
                >
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    {...register('currentSalaryUSD', { valueAsNumber: true })}
                  />
                </Field>
              </div>

              <Field
                label="Reason for Leaving Last Position"
                error={errors.reasonForLeaving?.message}
              >
                <Textarea
                  rows={3}
                  placeholder="Optional..."
                  maxLength={500}
                  {...register('reasonForLeaving')}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Resume & Video Intro
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Field
                label="Resume File (PDF only)"
                required
                error={resumeError ?? undefined}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-input px-4 py-8 text-center transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${dragOver ? 'border-foreground bg-muted/40' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e =>
                    e.key === 'Enter' && fileInputRef.current?.click()
                  }
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  {resumeFile ? (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      <span>{resumeFile.name}</span>
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        onClick={e => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                      >
                        <XIcon className="size-3 text-foreground/50" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="size-7 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Click or drag to upload resume
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF only (text-based), up to 10 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-foreground/20 bg-foreground p-4 text-background">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 opacity-80" />
                  <p className="text-xs leading-relaxed">
                    <strong className="font-semibold">Important:</strong> Upload
                    a <strong className="font-semibold">text-based PDF</strong>{' '}
                    only. Image-based or scanned PDFs cannot be parsed and will
                    result in missing data, making your application invalid.
                  </p>
                </div>
              </Field>

              <Field
                label="Personal Intro Video URL"
                error={errors.videoIntroUrl?.message}
              >
                <Input
                  placeholder="https://drive.google.com/..."
                  {...register('videoIntroUrl')}
                />
                <p className="text-xs text-muted-foreground">
                  Optional — accepts Google Drive, Loom, YouTube, Vimeo, etc.
                </p>
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 flex flex-col gap-5">
            <JobSummaryCard job={job} />
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!canSubmit}
              >
                <UploadIcon />
                Upload & Parse Resume
              </Button>
              <Link to={`/careers/${job._id}`}>
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// --- Step 3: Review parsed data ---

function ReviewStep({
  job,
  candidate,
  reviewData,
  setReviewData,
  videoIntroUrl,
  onSubmit,
  onBack,
  submitting,
}: {
  job: Job;
  candidate: CandidateApiResponse;
  reviewData: ReviewData;
  setReviewData: React.Dispatch<React.SetStateAction<ReviewData>>;
  videoIntroUrl: string;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const basicInfo = [
    ['First Name', candidate.firstName],
    ['Last Name', candidate.lastName],
    ['Email', candidate.email],
    ['Phone', candidate.phone],
    ['Years of Experience', String(candidate.yearsOfExperience)],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-muted px-4 py-3">
        <p className="text-sm text-muted-foreground">
          AI has extracted the following information from your resume. Please
          review and correct any errors before submitting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Basic Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {basicInfo.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Resume Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={reviewData.summary}
                onChange={e =>
                  setReviewData(prev => ({ ...prev, summary: e.target.value }))
                }
                className="resize-none"
                placeholder="No summary extracted — you can add one manually."
              />
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={reviewData.skills}
                onChange={skills =>
                  setReviewData(prev => ({ ...prev, skills }))
                }
                placeholder="Add skill..."
              />
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={reviewData.languages}
                onChange={languages =>
                  setReviewData(prev => ({ ...prev, languages }))
                }
                placeholder="Add language..."
              />
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={reviewData.certifications}
                onChange={certifications =>
                  setReviewData(prev => ({ ...prev, certifications }))
                }
                placeholder="Add certification..."
              />
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExperienceEditor
                entries={reviewData.experience}
                onChange={experience =>
                  setReviewData(prev => ({ ...prev, experience }))
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Education</CardTitle>
            </CardHeader>
            <CardContent>
              <EducationEditor
                entries={reviewData.education}
                onChange={education =>
                  setReviewData(prev => ({ ...prev, education }))
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground/80">
              <PencilIcon className="size-4 text-muted-foreground" />
              Edit anything that looks wrong, then submit.
            </div>
            <JobSummaryCard job={job} />
            {videoIntroUrl && (
              <Card className="rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-sm">
                    Video Intro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={videoIntroUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {videoIntroUrl}
                  </a>
                </CardContent>
              </Card>
            )}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
                disabled={submitting}
              >
                Back to upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Loading screen ---

function LoadingScreen({
  message,
  description,
}: {
  message: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Loader2Icon className="size-8 animate-spin text-foreground" />
        </div>
        <div>
          <p className="text-base font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

// --- Main page ---

type Step = 'input' | 'parsing' | 'review' | 'submitting' | 'success';

const EMPTY_REVIEW: ReviewData = {
  summary: '',
  skills: [],
  languages: [],
  certifications: [],
  experience: [],
  education: [],
};

export default function CareerApplyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('input');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateApiResponse | null>(null);
  const [inputValues, setInputValues] = useState<InputFormValues | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData>(EMPTY_REVIEW);

  const form = useForm<InputFormValues>({
    resolver: zodResolver(inputSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yearsOfExperience: 0,
      videoIntroUrl: '',
      englishProficiency: undefined,
      currentSalaryPHP: undefined,
      currentSalaryUSD: undefined,
      reasonForLeaving: '',
      cityOfResidence: '',
    },
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setJobError(null);
      try {
        const data = await publicApi.get<Job>(`/ats/jobs/${id}`);
        if (cancelled) return;
        setJob(data);
      } catch (e) {
        if (!cancelled) setJobError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleInputSubmit(values: InputFormValues) {
    if (!resumeFile) {
      setResumeError('Resume file is required');
      return;
    }
    setResumeError(null);
    setInputValues(values);
    setStep('parsing');

    const fd = new FormData();
    fd.append('firstName', values.firstName);
    fd.append('lastName', values.lastName);
    fd.append('email', values.email);
    fd.append('phone', values.phone);
    fd.append('yearsOfExperience', String(values.yearsOfExperience));
    if (values.englishProficiency)
      fd.append('englishProficiency', values.englishProficiency);
    if (values.currentSalaryPHP !== undefined)
      fd.append('currentSalaryPHP', String(values.currentSalaryPHP));
    if (values.currentSalaryUSD !== undefined)
      fd.append('currentSalaryUSD', String(values.currentSalaryUSD));
    if (values.reasonForLeaving)
      fd.append('reasonForLeaving', values.reasonForLeaving);
    if (values.cityOfResidence)
      fd.append('cityOfResidence', values.cityOfResidence);
    if (values.videoIntroUrl) {
      fd.append('videoIntroUrl', values.videoIntroUrl);
      fd.append('videoIntroSource', 'external');
    }
    fd.append('file', resumeFile);

    try {
      const created = await publicApi.postForm<CandidateApiResponse>(
        '/ats/candidates/public/upload-and-parse',
        fd
      );
      setCandidate(created);

      const MAX_POLLS = 30;
      let parsedData: CandidateParsedData | null = created.parsedData ?? null;

      for (let i = 0; i < MAX_POLLS && !parsedData; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const updated = await publicApi.get<CandidateApiResponse>(
            `/ats/candidates/${created._id}?includeRawText=true`
          );
          parsedData = updated.parsedData ?? null;
          if (parsedData) {
            setCandidate(updated);
          }
        } catch {
          // Polling may fail if endpoint requires auth; break and use whatever we have
          break;
        }
      }

      if (!parsedData) {
        toast.warning(
          'AI parsing is taking longer than expected. You can edit manually or the data may appear later.'
        );
      }

      setReviewData({
        summary: parsedData?.summary ?? '',
        skills: parsedData?.skills ?? [],
        languages: parsedData?.languages ?? [],
        certifications: parsedData?.certifications ?? [],
        experience: parsedData?.experience ?? [],
        education: parsedData?.education ?? [],
      });
      setStep('review');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setStep('input');
    }
  }

  async function handleSubmit() {
    if (!candidate || !inputValues || !id) return;
    setStep('submitting');

    try {
      await publicApi.post(`/ats/jobs/${id}/apply`, {
        candidateId: candidate._id,
        firstName: inputValues.firstName,
        lastName: inputValues.lastName,
        email: inputValues.email,
        phone: inputValues.phone,
        yearsOfExperience: inputValues.yearsOfExperience,
        englishProficiency: inputValues.englishProficiency ?? null,
        currentSalaryPHP: inputValues.currentSalaryPHP ?? null,
        currentSalaryUSD: inputValues.currentSalaryUSD ?? null,
        reasonForLeaving: inputValues.reasonForLeaving || null,
        cityOfResidence: inputValues.cityOfResidence || null,
        resumeUrl: candidate.resumeUrl ?? '',
        resumeOriginalName: candidate.resumeOriginalName ?? 'resume.pdf',
        resumeRawText: candidate.resumeRawText ?? '',
        videoIntroUrl: inputValues.videoIntroUrl || undefined,
        parsedData: {
          summary: reviewData.summary,
          skills: reviewData.skills,
          languages: reviewData.languages,
          certifications: reviewData.certifications,
          experience: reviewData.experience,
          education: reviewData.education,
        },
      });
      setStep('success');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
      setStep('review');
    }
  }

  function handleBackToUpload() {
    setCandidate(null);
    setInputValues(null);
    setReviewData(EMPTY_REVIEW);
    setStep('input');
  }

  // --- Loading state ---
  if (loading) return <ApplyPageSkeleton />;

  // --- Error / not found ---
  if (jobError || !job) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6">
        <p className="text-base text-muted-foreground">
          {jobError
            ? 'We couldn\u2019t load this job right now.'
            : 'This job is no longer available.'}
        </p>
        <Link to="/careers">
          <Button variant="outline" size="sm">
            Back to jobs
          </Button>
        </Link>
      </div>
    );
  }

  // --- Success ---
  if (step === 'success') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <CheckCircle2Icon className="size-8 text-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Application submitted
        </h1>
        <p className="max-w-md text-balance text-base text-muted-foreground">
          Thanks, {form.getValues('firstName')}. We&rsquo;ve received your
          application for <strong>{job.title}</strong> and will be in touch
          soon.
        </p>
        <Button onClick={() => navigate('/careers')}>Back to jobs</Button>
      </div>
    );
  }

  const parsing = step === 'parsing';
  const inReview = step === 'review' || step === 'submitting';

  const stepMeta: Record<Step, { title: string; desc: string }> = {
    input: {
      title: `Apply for ${job.title}`,
      desc: 'Fill in your details and upload your resume to begin.',
    },
    parsing: {
      title: 'Parsing Resume',
      desc: 'AI is extracting information from your uploaded resume.',
    },
    review: {
      title: 'Review Parsed Data',
      desc: 'Review and correct the extracted information before submitting.',
    },
    submitting: {
      title: 'Submitting Application',
      desc: 'Sending your application...',
    },
    success: {
      title: 'Application submitted',
      desc: '',
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="flex flex-col gap-5">
        <Link
          to={`/careers/${job._id}`}
          className="flex w-fit items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to job
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {stepMeta[step].title}
          </h1>
          <p className="text-base text-muted-foreground">
            {stepMeta[step].desc}
          </p>
        </div>
      </div>

      {step === 'input' && (
        <InputStep
          job={job}
          form={form}
          resumeFile={resumeFile}
          setResumeFile={file => {
            setResumeFile(file);
            if (file) setResumeError(null);
          }}
          resumeError={resumeError}
          onSubmit={handleInputSubmit}
        />
      )}

      {parsing && (
        <LoadingScreen
          message="Parsing resume..."
          description="AI is extracting structured information from your uploaded PDF."
        />
      )}

      {inReview && candidate && inputValues && (
        <ReviewStep
          job={job}
          candidate={candidate}
          reviewData={reviewData}
          setReviewData={setReviewData}
          videoIntroUrl={inputValues.videoIntroUrl ?? ''}
          onSubmit={handleSubmit}
          onBack={handleBackToUpload}
          submitting={step === 'submitting'}
        />
      )}
    </div>
  );
}

function ApplyPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-4 w-24 rounded-sm" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-2/3 rounded-sm" />
          <Skeleton className="h-5 w-1/2 rounded-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-sm" />
          <Skeleton className="h-64 w-full rounded-sm" />
        </div>
        <Skeleton className="h-80 w-full rounded-sm" />
      </div>
    </div>
  );
}
