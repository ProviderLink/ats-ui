import { Button } from '@/components/ui/button';
import { useJobStore } from '@/store';
import { XIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CandidatesTable } from './_components/candidates-table';

export default function CandidatesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId') ?? '';

  const fetchJobs = useJobStore(s => s.fetch);
  const jobs = useJobStore(s => s.items);

  // Jobs are only needed for the "filtered by job" banner.
  useEffect(() => {
    if (jobId) fetchJobs({ page: 1, limit: 9999 });
  }, [fetchJobs, jobId]);

  const job = jobId ? jobs.find(j => j._id === jobId) : null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      {job && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
          <span className="text-muted-foreground">Filtered by job:</span>
          <span className="font-medium">{job.title}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={() => navigate('/ats/candidates')}
            aria-label="Clear job filter"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      )}
      <CandidatesTable />
    </div>
  );
}
