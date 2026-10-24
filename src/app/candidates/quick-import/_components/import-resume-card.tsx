import { Field } from '@/components/candidate-form/field';
import { FileDropzone } from '@/components/candidate-form/file-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TriangleAlertIcon } from 'lucide-react';

interface ImportResumeCardProps {
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  resumeError: string | null;
}

export function ImportResumeCard({
  resumeFile,
  onResumeChange,
  resumeError,
}: ImportResumeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
            compact
            file={resumeFile}
            onFileChange={onResumeChange}
            accept=".pdf"
            allowedTypes={['application/pdf']}
            invalidMessage="Please upload a PDF file"
            prompt="Click or drag to upload resume"
            hint="PDF only (text-based), up to 10 MB"
          />
          <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-400 bg-amber-100 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs">
              <strong>Important:</strong> Upload a{' '}
              <strong>text-based PDF</strong> only. Image-based or scanned PDFs
              are not accepted and will be blocked — please upload a text-based
              PDF.
            </p>
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}
