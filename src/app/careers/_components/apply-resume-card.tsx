import { FileDropzone } from '@/components/candidate-form/file-dropzone';
import { Field } from '@/components/candidate-form/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TriangleAlertIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ApplyFormValues } from '../_utils/apply-form';

const PORTFOLIO_ACCEPT = '.pdf,.zip,image/png,image/jpeg,image/webp,image/gif';
const PORTFOLIO_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

interface ApplyResumeCardProps {
  form: UseFormReturn<ApplyFormValues>;
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  resumeError: string | null;
  portfolioFile: File | null;
  onPortfolioChange: (file: File | null) => void;
}

export function ApplyResumeCard({
  form,
  resumeFile,
  onResumeChange,
  resumeError,
  portfolioFile,
  onPortfolioChange,
}: ApplyResumeCardProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Card className="careers-card rounded-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Resume & Video Intro
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {resumeError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4"
          >
            <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm leading-relaxed text-destructive">
              {resumeError}
            </p>
          </div>
        )}
        <Field label="Resume File (PDF only)" required>
          <FileDropzone
            file={resumeFile}
            onFileChange={onResumeChange}
            accept=".pdf"
            allowedTypes={['application/pdf']}
            invalidMessage="Please upload a PDF file"
            prompt="Click or drag to upload resume"
            hint="PDF only (text-based), up to 10 MB"
          />
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              <strong className="font-semibold">Important:</strong> Upload a{' '}
              <strong className="font-semibold">text-based PDF</strong> only.
              Image-based or scanned PDFs are not accepted and will be blocked —
              please upload a text-based PDF.
            </p>
          </div>
        </Field>

        <Field
          label="Personal Intro Video URL"
          required
          error={errors.videoIntroUrl?.message}
        >
          <Input
            placeholder="https://drive.google.com/..."
            {...register('videoIntroUrl')}
          />
          <p className="text-xs text-muted-foreground">
            Accepts Google Drive, Loom, YouTube, Vimeo, etc.
          </p>
        </Field>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <Label>Portfolio</Label>
          <p className="text-xs text-muted-foreground">
            Optional — for roles where you have work samples to show (design,
            writing, video, etc.). Add a link, a file, or both.
          </p>
        </div>

        <Field label="Portfolio Link" error={errors.portfolioUrl?.message}>
          <Input
            placeholder="https://behance.net/... or a Drive link"
            {...register('portfolioUrl')}
          />
          <p className="text-xs text-muted-foreground">
            Behance, Dribbble, GitHub, Google Drive, personal website, etc.
          </p>
        </Field>

        <Field label="Portfolio File">
          <FileDropzone
            compact
            file={portfolioFile}
            onFileChange={onPortfolioChange}
            accept={PORTFOLIO_ACCEPT}
            allowedTypes={PORTFOLIO_TYPES}
            invalidMessage="Portfolio must be a PDF, ZIP, or image file"
            prompt="Click or drag to upload your portfolio"
            hint="PDF, ZIP, or image — up to 10 MB"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
