import { ActivityTimeline } from '@/components/activity-timeline';
import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { logOptimisticActivity } from '@/lib/activity';
import { useResolvedTags } from '@/lib/tags';
import { cn } from '@/lib/utils';
import type { Client, Job, JobPriority, JobStatus, SalaryRange } from '@/store';
import {
  useApplicationStore,
  useJobStore,
  usePipelineTemplateStore,
  useTagStore,
} from '@/store';
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronDownIcon,
  FlagIcon,
  LayersIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
  Trash2Icon,
  UserPlusIcon,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobCandidates } from './job-candidates';
import { JobPipelineBoard } from './job-pipeline-board';
import { NewJobSheet } from './new-job-sheet';
import { PipelineChangeDialog } from './pipeline-change-dialog';

const statusVariant: Record<
  JobStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  open: 'default',
  draft: 'secondary',
  on_hold: 'outline',
  closed: 'destructive',
};

const statusLabel: Record<JobStatus, string> = {
  open: 'Open',
  draft: 'Draft',
  on_hold: 'On Hold',
  closed: 'Closed',
};

const priorityVariant: Record<
  JobPriority,
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  urgent: 'destructive',
};

const priorityLabel: Record<JobPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Colours per priority so the chip itself communicates severity without
// relying solely on the word ('Medium', 'High', ...).
const priorityCls: Record<JobPriority, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40',
  high: 'bg-pine-teal-100 text-pine-teal-800 border-pine-teal-200 dark:bg-pine-teal-900/30 dark:text-pine-teal-300 dark:border-pine-teal-800/40',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
};

const jobTypeLabel: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  temporary: 'Temporary',
};

const locationTypeLabel: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

const experienceLevelLabel: Record<string, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
};

const salaryPeriodLabel: Record<string, string> = {
  hourly: 'hour',
  daily: 'day',
  weekly: 'week',
  bi_weekly: 'bi-week',
  monthly: 'month',
  yearly: 'year',
};

function formatSalary(sr: SalaryRange): string {
  const symbol = sr.currency === 'USD' ? '$' : sr.currency;
  const fmt = (n: number) => `${symbol}${n.toLocaleString()}`;
  return `${fmt(sr.min)} – ${fmt(sr.max)} / ${salaryPeriodLabel[sr.period]}`;
}

function formatDeadline(deadline: string): {
  text: string;
  destructive: boolean;
} {
  const now = new Date();
  const d = new Date(deadline);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Expired', destructive: true };
  if (diffDays === 0) return { text: 'Due today', destructive: false };
  if (diffDays === 1) return { text: '1 day left', destructive: false };
  return { text: `${diffDays} days left`, destructive: false };
}

type Props = { job: Job | null; clients: Client[] };

export function JobPanel({ job, clients }: Props) {
  const {
    setStatus,
    setPipeline,
    remove: removeJob,
    mutating,
    fetchOne,
    detail,
  } = useJobStore();
  const { items: pipelineTemplates, fetch: fetchPipelines } =
    usePipelineTemplateStore();
  const jobAppCount = useApplicationStore(
    s => s.items.filter(a => a.jobId === job?._id).length
  );
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineConfirmOpen, setPipelineConfirmOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!job) return;
    const url = `${window.location.origin}/careers/${job._id}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

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

  const currentPipelineTemplateId =
    fullJob.pipeline?.templateId ??
    // Fallback: if templateId is null but stages exist, match by comparing
    // stage _ids to find which template's stages match the job's pipeline.
    (fullJob.pipeline?.stages?.length
      ? pipelineTemplates.find(t => {
          const templateStageIds = new Set(
            t.stages.filter(s => s.isActive).map(s => s._id)
          );
          const jobStageIds = new Set(fullJob.pipeline!.stages.map(s => s._id));
          return (
            templateStageIds.size === jobStageIds.size &&
            [...templateStageIds].every(id => jobStageIds.has(id))
          );
        })?._id
      : null);

  async function handleStatusChange(status: JobStatus) {
    if (!fullJob) return;
    await setStatus(fullJob._id, status);
    logOptimisticActivity(
      'job',
      fullJob._id,
      'status_changed',
      `Job status changed to ${status}`
    );
  }

  async function handleDelete() {
    if (!fullJob) return;
    await removeJob(fullJob._id);
    setDeleteOpen(false);
  }

  async function handlePipelineChange(
    templateId: string,
    stageMapping?: Record<string, string>
  ) {
    if (!fullJob) return;
    await setPipeline(fullJob._id, templateId, stageMapping);
    logOptimisticActivity(
      'job',
      fullJob._id,
      'pipeline_changed',
      'Pipeline template updated'
    );
    setPipelineOpen(false);
    setPipelineConfirmOpen(false);
    // Refresh detail so currentPipelineTemplateId picks up the change
    void fetchOne(fullJob._id);
  }

  const selectedTemplate = selectedTemplateId
    ? pipelineTemplates.find(t => t._id === selectedTemplateId)
    : null;

  const currentPipeline = currentPipelineTemplateId
    ? pipelineTemplates.find(p => p._id === currentPipelineTemplateId)
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="relative px-6 py-5 flex items-start justify-between gap-4 border-b bg-card overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -left-10 size-52 rounded-full bg-primary/[0.07] dark:bg-primary/[0.1] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-4 size-40 rounded-full bg-muted-foreground/[0.06] dark:bg-muted-foreground/[0.08] blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, currentColor 0, currentColor 0.5px, transparent 0, transparent 10px)',
          }}
        />
        <div className="relative min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {/* Status — clickable dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 h-7 rounded-full border border-border bg-card pl-2 pr-1.5 text-sm hover:bg-accent hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={mutating}
                  aria-label={`Change status (current: ${statusLabel[fullJob.status]})`}
                >
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Status
                  </span>
                  <Badge
                    variant={statusVariant[fullJob.status]}
                    className="text-[11px] h-5 px-2 cursor-pointer select-none"
                  >
                    {statusLabel[fullJob.status]}
                  </Badge>
                  <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(statusLabel) as JobStatus[]).map(s => (
                  <DropdownMenuItem
                    key={s}
                    disabled={s === fullJob.status}
                    onClick={() => void handleStatusChange(s)}
                    className="text-sm"
                  >
                    <Badge
                      variant={statusVariant[s]}
                      className="text-[10px] h-4 px-1.5 mr-2"
                    >
                      {statusLabel[s]}
                    </Badge>
                    {s === fullJob.status && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        current
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge
              variant={priorityVariant[fullJob.priority]}
              className={cn(
                'text-[10px] h-5 px-1.5 gap-1 rounded-full border',
                priorityCls[fullJob.priority]
              )}
              title={`Priority: ${priorityLabel[fullJob.priority]}`}
            >
              <FlagIcon className="size-2.5" />
              <span className="hidden sm:inline">Priority:</span>
              {priorityLabel[fullJob.priority]}
            </Badge>

            {/* Pipeline — clickable dropdown */}
            <DropdownMenu
              open={pipelineOpen}
              onOpenChange={open => {
                setPipelineOpen(open);
                if (open) void fetchPipelines();
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex items-center gap-1.5 h-7 rounded-full border border-border bg-card pl-2 pr-1.5 text-sm hover:bg-accent hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={mutating}
                  aria-label="Change pipeline"
                >
                  <LayersIcon className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground hidden sm:inline max-w-40 truncate">
                    {currentPipeline?.name ?? 'Pipeline'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel className="text-xs">
                  Change Pipeline
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pipelineTemplates
                  .filter(p => p.isActive)
                  .map(p => {
                    const isCurrent = p._id === currentPipelineTemplateId;
                    return (
                      <DropdownMenuItem
                        key={p._id}
                        onClick={() => {
                          setPipelineOpen(false);
                          setSelectedTemplateId(p._id);
                          setPipelineConfirmOpen(true);
                        }}
                        className={cn(
                          'text-sm',
                          isCurrent && 'bg-accent font-semibold'
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            'size-4',
                            isCurrent ? 'text-primary' : 'text-transparent'
                          )}
                        />
                        <span className="flex-1">{p.name}</span>
                        {!isCurrent && p.isDefault && (
                          <span className="text-[10px] text-muted-foreground">
                            default
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xl font-bold leading-snug truncate">
            {fullJob.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="size-3 shrink-0" />
              {clientName}
            </span>
            {fullJob.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3 shrink-0" />
                {fullJob.location}
              </span>
            )}
          </div>
        </div>
        <div className="relative flex items-center gap-2 shrink-0 pt-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete job</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setEditOpen(true)}
                >
                  <PencilIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit job</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? (
                    <CheckIcon className="text-green-600" />
                  ) : (
                    <LinkIcon />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {linkCopied ? 'Copied!' : 'Copy public job link'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            size="sm"
            onClick={() =>
              navigate(`/ats/candidates/quick-import?jobId=${fullJob._id}`)
            }
          >
            <UserPlusIcon />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Missing pipeline warning banner */}
      {fullJob.status === 'open' &&
        (!fullJob.pipeline?.stages || fullJob.pipeline.stages.length === 0) && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30 flex items-center gap-3">
            <LayersIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
              This job has no pipeline. Candidates in pending phase cannot be
              approved until a pipeline is assigned. Use the pipeline selector
              above to assign one.
            </p>
          </div>
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
        {(['details', 'pipeline', 'candidates', 'activity'] as const).map(
          tab => (
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
          )
        )}
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

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete job?</DialogTitle>
            <DialogDescription>
              <strong>{fullJob.title}</strong> will be permanently removed. This
              cannot be undone.
              {jobAppCount > 0 && (
                <span className="mt-2 block text-xs rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive font-medium">
                  ⚠ This will also permanently delete {jobAppCount} application
                  {jobAppCount > 1 ? 's' : ''} for this job.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={mutating}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaField({
  label,
  value,
  destructive,
}: {
  label: string;
  value: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
        {label}
      </p>
      <div
        className={cn('text-sm font-medium', destructive && 'text-destructive')}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest shrink-0">
          {title}
        </span>
        <div className="flex-1 border-t" />
      </div>
      {children}
    </div>
  );
}

function normalizeBullets(items: string[] | undefined): string[] {
  if (!items?.length) return [];
  return items
    .flatMap(item =>
      item
        .split('•')
        .map(s => s.trim())
        .filter(Boolean)
    )
    .filter(s => s.length > 1 || Number.isNaN(Number(s)));
}

function JobDetails({ job, clientName }: { job: Job; clientName: string }) {
  const deadline = job.applicationDeadline
    ? formatDeadline(job.applicationDeadline)
    : null;
  const requirements = normalizeBullets(job.requirements);
  const responsibilities = normalizeBullets(job.responsibilities);
  const benefits = normalizeBullets(job.benefits);
  const jobTags = useResolvedTags(job.tags);
  const allTags = useTagStore(s => s.items);
  const updateJob = useJobStore(s => s.update);

  return (
    <div className="space-y-7 max-w-2xl">
      <Section title="Overview">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <MetaField label="Client" value={clientName} />
          <MetaField label="Job Type" value={jobTypeLabel[job.jobType]} />
          <MetaField
            label="Experience"
            value={experienceLevelLabel[job.experienceLevel]}
          />
          <MetaField
            label="Location Type"
            value={locationTypeLabel[job.locationType]}
          />
          {job.location && <MetaField label="Location" value={job.location} />}
          <MetaField label="Openings" value={String(job.openings)} />
        </div>
      </Section>

      <Section title="Compensation & Dates">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {job.salaryRange && (
            <div className="col-span-2 sm:col-span-1">
              <MetaField
                label="Salary Range"
                value={formatSalary(job.salaryRange)}
              />
            </div>
          )}
          {job.startDate && (
            <MetaField label="Start Date" value={job.startDate} />
          )}
          {deadline && (
            <MetaField
              label="Deadline"
              value={deadline.text}
              destructive={deadline.destructive}
            />
          )}
          <MetaField label="Posted" value={job.createdAt.slice(0, 10)} />
        </div>
      </Section>

      {(job.skills?.length ?? 0) > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {normalizeBullets(job.skills)
              .flatMap(s =>
                s
                  // Split on common delimiters when present (commas, bullets,
                  // pipes, semicolons, newlines); fall back to keeping the
                  // whole entry so paragraph-style skills just wrap inside
                  // their own chip instead of overflowing the container.
                  .split(/[,·|;\n]/)
                  .map(t => t.trim())
                  .filter(Boolean)
              )
              .map((skill, i) => (
                <Badge
                  key={`${skill}-${i}`}
                  variant="outline"
                  className="h-auto max-w-full min-w-0 overflow-visible whitespace-normal wrap-break-word rounded-md py-1 font-normal text-xs leading-snug"
                >
                  {skill}
                </Badge>
              ))}
          </div>
        </Section>
      )}

      <Section title="Tags">
        <TagsSelector
          allTags={allTags}
          selectedIds={jobTags.map(t => t._id)}
          onChange={ids => {
            void updateJob(job._id, { tags: ids });
          }}
          compact
        />
      </Section>

      <Section title="Description">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {job.description}
        </p>
      </Section>

      {requirements.length > 0 && (
        <Section title="Requirements">
          <BulletList items={requirements} />
        </Section>
      )}

      {responsibilities.length > 0 && (
        <Section title="Responsibilities">
          <BulletList items={responsibilities} />
        </Section>
      )}

      {benefits.length > 0 && (
        <Section title="Benefits">
          <BulletList items={benefits} />
        </Section>
      )}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const normalized = normalizeBullets(items);
  if (normalized.length === 0) return null;

  return (
    <ul className="space-y-2">
      {normalized.map((item, i) => (
        <li
          key={i}
          className="text-sm flex items-start gap-2.5 text-muted-foreground"
        >
          <span className="mt-2 size-1 rounded-full bg-muted-foreground/50 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
