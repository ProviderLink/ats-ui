import { jobStatusChangeMessage } from '@/lib/job-format';
import { withToast } from '@/lib/with-toast';
import { ActivityTimeline } from '@/components/activity-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logOptimisticActivity } from '@/lib/activity';
import { cn } from '@/lib/utils';
import type { Client, Job, JobStatus } from '@/store';
import {
  useApplicationStore,
  useJobStore,
  usePipelineTemplateStore,
} from '@/store';
import { useEffect, useState } from 'react';
import { resolveCurrentTemplateId } from '../_utils/job-details';
import { DeleteJobDialog } from './job-panel/delete-job-dialog';
import { JobDetails } from './job-panel/job-details';
import { JobPanelHeader } from './job-panel/job-panel-header';
import { MissingPipelineBanner } from './job-panel/missing-pipeline-banner';
import { JobCandidates } from './job-candidates';
import { JobPipelineBoard } from './job-pipeline-board';
import { NewJobSheet } from './new-job-sheet';
import { PipelineChangeDialog } from './pipeline-change-dialog';

interface JobPanelProps {
  job: Job | null;
  clients: Client[];
}

const TABS = ['details', 'pipeline', 'candidates', 'activity'] as const;

export function JobPanel({ job, clients }: JobPanelProps) {
  const setStatus = useJobStore(s => s.setStatus);
  const setPipeline = useJobStore(s => s.setPipeline);
  const removeJob = useJobStore(s => s.remove);
  const mutating = useJobStore(s => s.mutating);
  const fetchOne = useJobStore(s => s.fetchOne);
  const detail = useJobStore(s => s.detail);
  const pipelineTemplates = usePipelineTemplateStore(s => s.items);
  const fetchPipelines = usePipelineTemplateStore(s => s.fetch);
  const jobAppCount = useApplicationStore(
    s => s.items.filter(a => a.jobId === job?._id).length
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pipelineConfirmOpen, setPipelineConfirmOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const clientName =
    clients.find(c => c._id === job?.clientId)?.companyName ?? '—';

  useEffect(() => {
    if (job) void fetchPipelines();
  }, [job?._id, fetchPipelines]);

  useEffect(() => {
    if (job) void fetchOne(job._id);
  }, [job?._id, fetchOne]);

  const fullJob = job ? (detail[job._id] ?? job) : null;

  if (!fullJob) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Select a job to view details
      </div>
    );
  }

  const currentTemplateId = resolveCurrentTemplateId(
    fullJob,
    pipelineTemplates
  );
  const selectedTemplate = selectedTemplateId
    ? pipelineTemplates.find(t => t._id === selectedTemplateId)
    : null;

  async function handleStatusChange(status: JobStatus) {
    if (!fullJob) return;
    await withToast(jobStatusChangeMessage(status), () =>
      setStatus(fullJob._id, status)
    );
    logOptimisticActivity(
      'job',
      fullJob._id,
      'status_changed',
      `Job status changed to ${status}`
    );
  }

  async function handleDelete() {
    if (!fullJob) return;
    await withToast('Job deleted', () => removeJob(fullJob._id));
    setDeleteOpen(false);
  }

  async function handlePipelineChange(
    templateId: string,
    stageMapping?: Record<string, string>
  ) {
    if (!fullJob) return;
    await withToast('Pipeline assigned', () =>
      setPipeline(fullJob._id, templateId, stageMapping)
    );
    logOptimisticActivity(
      'job',
      fullJob._id,
      'pipeline_changed',
      'Pipeline template updated'
    );
    setPipelineConfirmOpen(false);
    // Refresh detail so the current template picks up the change.
    void fetchOne(fullJob._id);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <JobPanelHeader
        job={fullJob}
        clientName={clientName}
        mutating={mutating}
        templates={pipelineTemplates}
        currentTemplateId={currentTemplateId}
        onStatusChange={status => void handleStatusChange(status)}
        onPipelineMenuOpen={() => void fetchPipelines()}
        onSelectPipeline={id => {
          setSelectedTemplateId(id);
          setPipelineConfirmOpen(true);
        }}
        onDelete={() => setDeleteOpen(true)}
        onEdit={() => setEditOpen(true)}
      />

      {fullJob.status === 'open' &&
        (!fullJob.pipeline?.stages || fullJob.pipeline.stages.length === 0) && (
          <MissingPipelineBanner />
        )}

      <Tabs
        defaultValue="details"
        className="flex-1 flex flex-col overflow-hidden gap-0"
      >
        <div className="px-6 pt-3 pb-3 border-b">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>
        {TABS.map(tab => (
          <TabsContent
            key={tab}
            value={tab}
            className={cn(
              'flex-1 bg-card dark:bg-black/[0.15]',
              tab === 'pipeline' ? 'overflow-hidden' : 'overflow-y-auto p-6'
            )}
          >
            {tab === 'details' ? (
              <JobDetails job={fullJob} clientName={clientName} />
            ) : tab === 'pipeline' ? (
              <JobPipelineBoard key={fullJob._id} job={fullJob} />
            ) : tab === 'candidates' ? (
              <JobCandidates key={fullJob._id} job={fullJob} />
            ) : (
              <ActivityTimeline resourceType="job" resourceId={fullJob._id} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <NewJobSheet
        key={fullJob._id}
        job={fullJob}
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
      />

      {selectedTemplate && (
        <PipelineChangeDialog
          open={pipelineConfirmOpen}
          onOpenChange={setPipelineConfirmOpen}
          job={fullJob}
          newTemplate={selectedTemplate}
          loading={mutating}
          onConfirm={stageMapping =>
            void handlePipelineChange(selectedTemplate._id, stageMapping)
          }
        />
      )}

      <DeleteJobDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        jobTitle={fullJob.title}
        applicationCount={jobAppCount}
        deleting={mutating}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
