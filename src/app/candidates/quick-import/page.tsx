import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getJson, patchJson, postForm, postJson } from '@/lib/api-client';
import { useClientStore } from '@/store/slices/clients.store';
import { useJobStore } from '@/store/slices/jobs.store';
import type { CandidateParsedData } from '@/store/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Controller,
  useController,
  useForm,
  type Control,
} from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
};

// --- Zod schema ---

const inputSchema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName: z.string().min(1, 'Required').max(50),
  email: z.string().min(1, 'Required').email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  yearsOfExperience: z.number().min(0, 'Must be 0 or more'),
  jobId: z.string().min(1, 'Job assignment is required'),
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

// --- Shared utility ---

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

// --- Tag input ---

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

// --- Experience editor ---

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
        <Card key={i}>
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

// --- Education editor ---

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
        <Card key={i}>
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

// --- Job search select ---

function JobSearchSelect({
  jobs,
  control,
  name,
  error,
}: {
  jobs: { _id: string; title: string; clientName: string }[];
  control: Control<InputFormValues>;
  name: 'jobId';
  error?: string;
}) {
  const { field } = useController({ control, name });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = jobs.find(j => j._id === field.value);

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      j =>
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  function select(id: string) {
    field.onChange(id);
    setSearch('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    field.onChange('');
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={`flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${error ? 'border-destructive' : 'border-input'}`}
          >
            {selected ? (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">{selected.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {selected.clientName}
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Search and select a job...
              </span>
            )}
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              {field.value && (
                <span
                  role="button"
                  className="rounded p-0.5 hover:bg-muted"
                  onPointerDown={clear}
                >
                  <XIcon className="size-3.5 text-muted-foreground" />
                </span>
              )}
              <ChevronsUpDownIcon className="size-3.5 text-muted-foreground shrink-0" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-0"
          align="start"
          onPointerDownOutside={e => {
            // Don't close when clicking inside the popover
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex items-center border-b px-3 py-2">
            <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search by title or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No jobs found.
              </p>
            ) : (
              filtered.map(job => (
                <button
                  key={job._id}
                  type="button"
                  className={`flex w-full flex-col rounded-sm px-3 py-2.5 text-left transition-colors hover:bg-accent ${job._id === field.value ? 'bg-primary/10 border-l-2 border-l-primary rounded-l-none' : ''}`}
                  onPointerDown={e => {
                    e.preventDefault();
                    select(job._id);
                  }}
                >
                  <span
                    className={`text-sm ${job._id === field.value ? 'font-semibold' : 'font-medium'}`}
                  >
                    {job.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {job.clientName}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// --- Step 1: Input form ---

function InputStep({
  form,
  resumeFile,
  setResumeFile,
  resumeError,
  openJobs,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<InputFormValues>>;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  resumeError: string | null;
  openJobs: { _id: string; title: string; clientName: string }[];
  onSubmit: (values: InputFormValues) => void;
}) {
  const navigate = useNavigate();
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {/* City of Residence */}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {/* Reason for Leaving */}
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

          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field
                label="Resume File (PDF only)"
                required
                error={resumeError ?? undefined}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className={`flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input px-4 py-6 text-center transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${dragOver ? 'border-primary bg-accent' : ''}`}
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
                      <FileTextIcon className="size-4 text-primary" />
                      <span>{resumeFile.name}</span>
                      <button
                        type="button"
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        onClick={e => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                      >
                        <XIcon className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="size-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
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
                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                  <p className="text-xs">
                    <strong>Important:</strong> Upload a{' '}
                    <strong>text-based PDF</strong> only. Image-based or scanned
                    PDFs cannot be parsed and will result in missing data,
                    making the candidacy invalid.
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

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Assignment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <JobSearchSelect
                jobs={openJobs}
                control={control}
                name="jobId"
                error={errors.jobId?.message}
              />

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium">Internal Upload</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              <UploadIcon />
              Upload & Parse Resume
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/ats/candidates')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

// --- Step 3: Review parsed data ---

function ReviewStep({
  candidate,
  reviewData,
  setReviewData,
  videoIntroUrl,
  jobId,
  openJobs,
  onImport,
  onCancel,
}: {
  candidate: CandidateApiResponse;
  reviewData: ReviewData;
  setReviewData: React.Dispatch<React.SetStateAction<ReviewData>>;
  videoIntroUrl: string;
  jobId: string;
  openJobs: { _id: string; title: string; clientName: string }[];
  onImport: () => void;
  onCancel: () => void;
}) {
  const selectedJob = openJobs.find(j => j._id === jobId);

  const basicInfo = [
    ['First Name', candidate.firstName],
    ['Last Name', candidate.lastName],
    ['Email', candidate.email],
    ['Phone', candidate.phone],
    ['Years of Experience', String(candidate.yearsOfExperience)],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-accent/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          AI has extracted the following information from the resume. Please
          review and correct any errors before importing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Resume Summary</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
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

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">
                  Assigning to Job
                </p>
                <p className="text-sm font-medium">
                  {selectedJob?.title ?? jobId}
                </p>
                {selectedJob && (
                  <p className="text-xs text-muted-foreground">
                    {selectedJob.clientName}
                  </p>
                )}
              </div>

              {videoIntroUrl && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-muted-foreground">
                      Video Intro URL
                    </p>
                    <a
                      href={videoIntroUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {videoIntroUrl}
                    </a>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium">Internal Upload</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onImport}>
              Import Candidate
            </Button>
            <Button variant="outline" className="w-full" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Loading screen (steps 2 & 4) ---

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
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <Loader2Icon className="size-8 animate-spin text-primary" />
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

type Step = 'input' | 'parsing' | 'review' | 'importing';

const EMPTY_REVIEW: ReviewData = {
  summary: '',
  skills: [],
  languages: [],
  certifications: [],
  experience: [],
  education: [],
};

export default function CandidateQuickImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetJobId = searchParams.get('jobId') ?? '';
  const [step, setStep] = useState<Step>('input');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateApiResponse | null>(null);
  const [inputValues, setInputValues] = useState<InputFormValues | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData>(EMPTY_REVIEW);
  const allJobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);
  const clients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);

  useEffect(() => {
    void fetchJobs({ status: 'open', limit: 9999 });
    if (clients.length === 0) fetchClients({ limit: 9999 });
  }, [fetchJobs, fetchClients, clients.length]);

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map(c => [c._id, c.companyName])),
    [clients]
  );

  const openJobs = useMemo(
    () =>
      allJobs
        .filter(j => j.status === 'open')
        .map(j => ({
          _id: j._id,
          title: j.title,
          clientName: clientMap[j.clientId] ?? j.clientId,
        })),
    [allJobs, clientMap]
  );

  // If the preset job (e.g. linked from /jobs) isn't in the cached open
  // jobs list yet, ensure it still shows in the dropdown so the user
  // doesn't see an empty selection.
  const openJobsWithPreset = useMemo(() => {
    if (!presetJobId) return openJobs;
    if (openJobs.some(j => j._id === presetJobId)) return openJobs;
    const preset = allJobs.find(j => j._id === presetJobId);
    if (!preset) return openJobs;
    return [
      ...openJobs,
      {
        _id: preset._id,
        title: preset.title,
        clientName: clientMap[preset.clientId] ?? preset.clientId,
      },
    ];
  }, [openJobs, presetJobId, allJobs, clientMap]);

  const form = useForm<InputFormValues>({
    resolver: zodResolver(inputSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yearsOfExperience: 0,
      jobId: presetJobId,
      videoIntroUrl: '',
      englishProficiency: undefined,
      currentSalaryPHP: undefined,
      currentSalaryUSD: undefined,
      reasonForLeaving: '',
      cityOfResidence: '',
    },
  });

  async function handleInputSubmit(values: InputFormValues) {
    if (!resumeFile) {
      setResumeError('Resume file is required');
      return;
    }
    setResumeError(null);
    setInputValues(values);
    setStep('parsing');

    const formData = new FormData();
    formData.append('firstName', values.firstName);
    formData.append('lastName', values.lastName);
    formData.append('email', values.email);
    formData.append('phone', values.phone);
    formData.append('yearsOfExperience', String(values.yearsOfExperience));
    if (values.englishProficiency)
      formData.append('englishProficiency', values.englishProficiency);
    if (values.currentSalaryPHP !== undefined)
      formData.append('currentSalaryPHP', String(values.currentSalaryPHP));
    if (values.currentSalaryUSD !== undefined)
      formData.append('currentSalaryUSD', String(values.currentSalaryUSD));
    if (values.reasonForLeaving)
      formData.append('reasonForLeaving', values.reasonForLeaving);
    if (values.cityOfResidence)
      formData.append('cityOfResidence', values.cityOfResidence);
    if (values.videoIntroUrl) {
      formData.append('videoIntroUrl', values.videoIntroUrl);
      formData.append('videoIntroSource', 'external');
    }
    formData.append('file', resumeFile);

    try {
      const created = await postForm<CandidateApiResponse>(
        '/ats/candidates',
        formData
      );
      setCandidate(created);

      const MAX_POLLS = 30;
      let parsedData: CandidateParsedData | null = created.parsedData ?? null;

      for (let i = 0; i < MAX_POLLS && !parsedData; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const updated = await getJson<CandidateApiResponse>(
          `/ats/candidates/${created._id}?includeRawText=true`
        );
        parsedData = updated.parsedData ?? null;
        if (parsedData) {
          setCandidate(updated);
        }
      }

      if (!parsedData) {
        toast.warning(
          'AI parsing timed out. You can edit manually or the data may appear later.'
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

  async function handleImport() {
    if (!candidate || !inputValues) return;
    setStep('importing');

    try {
      await patchJson(`/ats/candidates/${candidate._id}`, {
        firstName: inputValues.firstName,
        lastName: inputValues.lastName,
        phone: inputValues.phone,
        yearsOfExperience: inputValues.yearsOfExperience,
        englishProficiency: inputValues.englishProficiency ?? null,
        currentSalaryPHP: inputValues.currentSalaryPHP ?? null,
        currentSalaryUSD: inputValues.currentSalaryUSD ?? null,
        reasonForLeaving: inputValues.reasonForLeaving || null,
        cityOfResidence: inputValues.cityOfResidence || null,
        parsedData: {
          summary: reviewData.summary,
          skills: reviewData.skills,
          languages: reviewData.languages,
          certifications: reviewData.certifications,
          experience: reviewData.experience,
          education: reviewData.education,
        },
        videoIntroUrl: inputValues.videoIntroUrl || undefined,
        videoIntroSource: inputValues.videoIntroUrl ? 'external' : undefined,
      });

      await postJson(`/ats/candidates/${candidate._id}/assign-job`, {
        jobId: inputValues.jobId,
      });

      const job = allJobs.find(j => j._id === inputValues.jobId);
      toast.success(
        `Candidate ${candidate.firstName} ${candidate.lastName} imported and assigned to ${job?.title ?? inputValues.jobId}`
      );

      form.reset();
      setResumeFile(null);
      setCandidate(null);
      setInputValues(null);
      setReviewData(EMPTY_REVIEW);
      setStep('input');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
      setStep('review');
    }
  }

  function handleCancelReview() {
    setCandidate(null);
    setInputValues(null);
    setReviewData(EMPTY_REVIEW);
    setStep('input');
  }

  const isLoading = step === 'parsing' || step === 'importing';

  const stepMeta: Record<Step, { title: string; desc: string }> = {
    input: {
      title: 'Quick Import Candidate',
      desc: 'Upload a candidate internally — source will be marked as Internal Upload.',
    },
    parsing: {
      title: 'Parsing Resume',
      desc: 'AI is extracting information from the uploaded resume.',
    },
    review: {
      title: 'Review Parsed Data',
      desc: 'Review and correct the extracted information before importing.',
    },
    importing: {
      title: 'Importing Candidate',
      desc: 'Assigning candidate to the selected job...',
    },
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isLoading}
          onClick={() =>
            step === 'review'
              ? handleCancelReview()
              : navigate('/ats/candidates')
          }
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-base font-semibold">{stepMeta[step].title}</h1>
          <p className="text-sm text-muted-foreground">{stepMeta[step].desc}</p>
        </div>
      </div>

      {step === 'input' && (
        <InputStep
          form={form}
          resumeFile={resumeFile}
          setResumeFile={file => {
            setResumeFile(file);
            if (file) setResumeError(null);
          }}
          resumeError={resumeError}
          openJobs={openJobsWithPreset}
          onSubmit={handleInputSubmit}
        />
      )}

      {step === 'parsing' && (
        <LoadingScreen
          message="Parsing resume..."
          description="AI is extracting structured information from the uploaded PDF."
        />
      )}

      {step === 'review' && candidate && inputValues && (
        <ReviewStep
          candidate={candidate}
          reviewData={reviewData}
          setReviewData={setReviewData}
          videoIntroUrl={inputValues.videoIntroUrl ?? ''}
          jobId={inputValues.jobId}
          openJobs={openJobsWithPreset}
          onImport={handleImport}
          onCancel={handleCancelReview}
        />
      )}

      {step === 'importing' && (
        <LoadingScreen
          message="Importing candidate..."
          description="Assigning candidate to the selected job. Please wait."
        />
      )}
    </div>
  );
}
