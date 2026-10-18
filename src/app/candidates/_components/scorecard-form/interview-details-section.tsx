import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { ScorecardField } from './scorecard-field';

interface InterviewDetailsSectionProps {
  jobOptions: { _id: string; title: string }[];
  defaultJobId?: string | null;
  isEditing: boolean;
  interviewerOptions: { _id: string; name: string; role: string }[];
  interviewersLoading: boolean;
}

export function InterviewDetailsSection({
  jobOptions,
  defaultJobId,
  isEditing,
  interviewerOptions,
  interviewersLoading,
}: InterviewDetailsSectionProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ScorecardFormValues>();

  return (
    <section className="flex flex-col gap-3">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Interview
      </Label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScorecardField
          label="Job"
          error={errors.jobId?.message}
          hint={
            isEditing
              ? 'Job is fixed when editing an existing scorecard.'
              : defaultJobId
                ? 'Auto-selected from the active pipeline job — change if needed.'
                : undefined
          }
          required
        >
          <Controller
            control={control}
            name="jobId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isEditing}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.jobId}
                >
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {jobOptions.map(j => (
                    <SelectItem key={j._id} value={j._id}>
                      <span className="flex items-center gap-2">
                        {j.title}
                        {j._id === defaultJobId && (
                          <Badge
                            variant="outline"
                            className="h-4 border-primary/30 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                          >
                            Current
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </ScorecardField>

        <ScorecardField
          label="Interviewer"
          error={errors.interviewerId?.message}
          required
        >
          <Controller
            control={control}
            name="interviewerId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.interviewerId}
                >
                  <SelectValue
                    placeholder={
                      interviewersLoading
                        ? 'Loading interviewers…'
                        : 'Select interviewer'
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {interviewerOptions.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {interviewersLoading
                        ? 'Loading team members…'
                        : 'No team members available'}
                    </div>
                  ) : (
                    interviewerOptions.map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        <span className="flex items-center justify-between gap-3">
                          <span>{u.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {u.role}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </ScorecardField>

        <ScorecardField
          label="Interview date"
          error={errors.interviewDate?.message}
          required
        >
          <Input type="datetime-local" {...register('interviewDate')} />
        </ScorecardField>
      </div>
    </section>
  );
}
