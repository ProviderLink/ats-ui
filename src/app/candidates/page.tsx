import { Button } from '@/components/ui/button';
import { useJobStore } from '@/store';
import { XIcon } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CandidatesTable } from './_components/candidates-table';

function CandidatesPageContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('jobId') ?? '';

  const { fetch: fetchJobs, items: jobs } = useJobStore();

  // Only pre-fetch jobs when a jobId filter is active — the table needs
  // them just to render the "filtered by job" banner.
  // Candidate fetching is handled server-side inside CandidatesTable.
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

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesPageContent />
    </Suspense>
  );
}
