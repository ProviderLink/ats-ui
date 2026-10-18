import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ScheduleCandidateOption } from './schedule-interview-types';

interface JobCandidatePickerProps {
  jobId: string;
  jobOptions: { _id: string; title: string }[];
  onJobChange: (jobId: string) => void;
  candidates: ScheduleCandidateOption[];
  candidateId?: string;
  onCandidateChange?: (candidateId: string) => void;
}

export function JobCandidatePicker({
  jobId,
  jobOptions,
  onJobChange,
  candidates,
  candidateId,
  onCandidateChange,
}: JobCandidatePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Job *</Label>
        <Select value={jobId} onValueChange={onJobChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select job…" />
          </SelectTrigger>
          <SelectContent>
            {jobOptions.map(j => (
              <SelectItem key={j._id} value={j._id}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="si-candidate">Candidate *</Label>
        {candidates.length === 0 ? (
          <p className="flex h-9 items-center text-xs text-muted-foreground">
            {jobId ? 'No candidates on this job' : 'Select a job first'}
          </p>
        ) : (
          <Select
            value={candidateId ?? ''}
            onValueChange={v => onCandidateChange?.(v)}
          >
            <SelectTrigger id="si-candidate" className="w-full">
              <SelectValue placeholder="Select candidate…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map(c => (
                <SelectItem key={c._id} value={c._id}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
