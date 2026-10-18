import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  formatSalary,
  jobTypeLabel,
  locationTypeLabel,
} from '@/lib/job-format';
import type { Job } from '@/store';
import { MapPinIcon, UsersIcon } from 'lucide-react';

export function JobSummaryCard({ job }: { job: Job }) {
  return (
    <Card className="careers-card rounded-2xl">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Applying for</p>
          <p className="font-heading text-lg font-semibold leading-snug">
            {job.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-4" />
            {job.location ?? 'Remote'}
          </span>
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
        {job.salaryRange && (
          <>
            <Separator />
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Compensation</p>
              <p className="text-sm font-medium">
                {formatSalary(job.salaryRange)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
