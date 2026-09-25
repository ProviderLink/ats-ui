import { ActivityTimeline } from '@/components/activity-timeline';
import { PortfolioSection } from '@/components/portfolio-section';
import { ResumeViewer } from '@/components/resume-viewer';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { logOptimisticActivity } from '@/lib/activity';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type {
  Candidate,
  ParsedEducation,
  ParsedExperience,
} from '@/store/types';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CheckIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlayIcon,
  SearchIcon,
  StarIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { avatarBg } from '../../candidates/_utils/candidate-styles';

function TalentPoolNotesEditor({
  notes,
  mutating,
  onSave,
}: {
  notes: string;
  mutating: boolean;
  onSave: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <Textarea
          rows={4}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="resize-none text-sm"
          placeholder="Add a note about this candidate…"
          disabled={mutating}
        />
        <div className="flex items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setEditing(false);
              setDraft(notes);
            }}
            disabled={mutating}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className="h-7 text-xs"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            disabled={mutating}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {notes.trim() ? (
        <p className="text-sm text-muted-foreground leading-relaxed italic whitespace-pre-wrap pr-6">
          "{notes}"
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">
          No notes added
        </p>
      )}
      <Button
        variant="outline"
        size="icon-xs"
        className="absolute top-0 right-0 bg-background/60 backdrop-blur-sm hover:bg-background/80"
        onClick={() => {
          setDraft(notes);
          setEditing(true);
        }}
        title="Edit notes"
      >
        <PencilIcon className="size-3.5" />
      </Button>
    </div>
  );
}

function IntroVideo({
  url,
  source,
}: {
  url: string;
  source?: 'cloudinary' | 'external' | null;
}) {
  const isCloudinary = source === 'cloudinary' || url.includes('cloudinary');
  return (
    <div className="flex flex-col gap-2 h-96">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <VideoIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Intro Video</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          asChild
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="size-3.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      {isCloudinary ? (
        <div className="flex-1 rounded-lg border bg-black overflow-hidden">
          <video src={url} controls className="size-full" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 p-4 text-center">
          <PlayIcon className="size-8 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            External video link — please open the link below to watch the
            candidate&apos;s intro video.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open video
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function ExperienceTimeline({ items }: { items: ParsedExperience[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No experience listed.</p>
    );
  return (
    <div className="flex flex-col">
      {items.map((exp, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1.5 size-2 shrink-0 rounded-full bg-pine-teal-600 dark:bg-pine-teal-400" />
            {i < items.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-border" />
            )}
          </div>
          <div
            className={cn('min-w-0', i < items.length - 1 ? 'pb-5' : 'pb-1')}
          >
            <p className="text-sm font-medium leading-tight">{exp.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {exp.company} · {exp.duration}
            </p>
            {exp.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {exp.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationList({ items }: { items: ParsedEducation[] }) {
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No education listed.</p>
    );
  return (
    <div className="flex flex-col gap-3">
      {items.map((edu, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
            <GraduationCapIcon className="size-3.5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {edu.degree} in {edu.field}
            </p>
            <p className="text-xs text-muted-foreground">
              {edu.institution} · {edu.year}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignJobDialog({
  open,
  onClose,
  onConfirm,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (jobId: string, startStageId?: string) => void;
  jobs: {
    _id: string;
    title: string;
    stages?: { _id: string; name: string }[];
  }[];
}) {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q));
  }, [jobs, search]);

  const selectedJob = useMemo(
    () => jobs.find(j => j._id === selected),
    [jobs, selected]
  );
  const stages = selectedJob?.stages ?? [];

  const handleSelectJob = (jobId: string) => {
    setSelected(jobId);
    setSelectedStageId('');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to a new job</DialogTitle>
          <DialogDescription className="sr-only">
            Search for a job and assign this candidate to it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No jobs found
              </p>
            ) : (
              <div className="flex flex-col">
                {filtered.map(j => (
                  <button
                    key={j._id}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                      selected === j._id && 'bg-muted font-medium'
                    )}
                    onClick={() => handleSelectJob(j._id)}
                  >
                    <span
                      className={cn(
                        'size-4 rounded-full border flex items-center justify-center shrink-0',
                        selected === j._id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {selected === j._id && <CheckIcon className="size-3" />}
                    </span>
                    {j.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Stage picker */}
          {stages.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Starting pipeline stage (optional)
              </Label>
              <Select
                value={selectedStageId}
                onValueChange={setSelectedStageId}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="First stage (default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">First stage (default)</SelectItem>
                  {stages.map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              onConfirm(selected, selectedStageId || undefined);
              setSelected('');
              setSelectedStageId('');
              setSearch('');
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mutating?: boolean;
};

export function TalentPoolDetailSheet({
  candidate,
  open,
  onOpenChange,
  mutating = false,
}: Props) {
  const [assignJobOpen, setAssignJobOpen] = useState(false);
  const [removePoolConfirmOpen, setRemovePoolConfirmOpen] = useState(false);

  const updateTalentPool = useCandidateStore(s => s.updateTalentPool);
  const updateCandidate = useCandidateStore(s => s.update);
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const assignJob = useCandidateStore(s => s.assignJob);

  const jobs = useJobStore(s => s.items);
  const fetchJobs = useJobStore(s => s.fetch);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  // Fetch jobs for the assign-to-job dialog
  useEffect(() => {
    if (open && jobs.length === 0) {
      fetchJobs({ page: 1, limit: 9999 });
    }
  }, [open, jobs.length, fetchJobs]);

  const openJobs = useMemo(
    () =>
      jobs
        .filter(j => j.status === 'open')
        .map(j => ({
          _id: j._id,
          title: j.title,
          stages: (j.pipeline?.stages ?? [])
            .filter(s => s.isActive)
            .sort((a, b) => a.order - b.order)
            .map(s => ({ _id: s._id, name: s.name })),
        })),
    [jobs]
  );

  async function handleRemoveFromTalentPool() {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'remove');
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'talent_pool_removed',
        `${candidate.firstName} ${candidate.lastName} removed from talent pool`
      );
      toast.success('Removed from Talent Pool');
      setRemovePoolConfirmOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleUpdatePoolNotes(notes: string) {
    if (!candidate) return;
    try {
      await updateTalentPool(candidate._id, 'add', notes);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'note_updated',
        `Talent pool notes updated for ${candidate.firstName} ${candidate.lastName}`
      );
      toast.success('Notes saved');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleUpdateTags(tagIds: string[]) {
    if (!candidate) return;
    try {
      await updateCandidate(candidate._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

  async function handleAssignToJob(jobId: string, startStageId?: string) {
    if (!candidate) return;
    try {
      await assignJob(candidate._id, jobId, startStageId);
      logOptimisticActivity(
        'candidate',
        candidate._id,
        'created',
        `Applied to job`
      );
      toast.success('Assigned to job');
      setAssignJobOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Read the latest version from the store so save operations are visible
  // immediately. The `candidate` prop is a snapshot from when the sheet
  // opened; `items` and `detail` stay current across mutations.
  const current = useCandidateStore(s => {
    if (!candidate) return undefined;
    // Prefer the individually-fetched detail, then the list item, then fall
    // back to the prop snapshot.
    return (
      s.detail[candidate._id] ?? s.items.find(i => i._id === candidate._id)
    );
  });

  if (!candidate) return null;

  const c = current ?? candidate;

  const fullName = `${c.firstName} ${c.lastName}`;
  const bg = avatarBg(c.firstName);
  const { parsedData } = c;

  const skills = parsedData?.skills ?? [];
  const languages = parsedData?.languages ?? [];
  const certifications = parsedData?.certifications ?? [];
  const experience = parsedData?.experience ?? [];
  const education = parsedData?.education ?? [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 max-w-none! w-full sm:w-[60vw] min-w-95"
        >
          {/* Header */}
          <SheetHeader className="shrink-0 border-b pl-6 pr-14 py-5">
            {/*
              Visually hidden. The markup below presents the candidate's name
              and avatar directly, so without these the sheet has no accessible
              name and Radix logs a missing-Title warning. `sr-only` leaves the
              rendered design unchanged.
            */}
            <SheetTitle className="sr-only">{`Candidate: ${fullName}`}</SheetTitle>
            <SheetDescription className="sr-only">
              Talent pool candidate profile, resume and activity.
            </SheetDescription>
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={fullName}
                  className="size-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-semibold select-none',
                    bg
                  )}
                >
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight">
                  {fullName}
                </p>
                {(parsedData?.experience ?? [])[0] && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {parsedData!.experience![0].title}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MailIcon className="size-3.5" />
                    {c.email}
                  </a>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PhoneIcon className="size-3.5" />
                    {c.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BriefcaseIcon className="size-3.5" />
                    {c.yearsOfExperience} yrs exp
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <TagsSelector
                    allTags={allTags}
                    selectedIds={getTagIds(candidate?.tags)}
                    onChange={handleUpdateTags}
                    compact
                  />
                  {c.eligibilityStatus === 'permanently_ineligible' && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px]"
                    >
                      Permanently Ineligible
                    </Badge>
                  )}
                  {c.legalHold && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px]"
                    >
                      Legal Hold
                    </Badge>
                  )}
                </div>
                {c.talentPoolAddedAt && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Added to pool:{' '}
                    {new Date(c.talentPoolAddedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {c.inTalentPool && (
                <div className="shrink-0 flex flex-col items-end gap-2 w-72">
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={mutating}
                    onClick={() => setRemovePoolConfirmOpen(true)}
                  >
                    <XIcon className="size-3" /> Remove from talent pool
                  </Button>
                  <div className="w-full rounded-md border bg-muted/30 px-3 py-3 min-h-24">
                    <TalentPoolNotesEditor
                      notes={c.talentPoolNotes ?? ''}
                      mutating={mutating}
                      onSave={handleUpdatePoolNotes}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                className="gap-1.5 px-4"
                onClick={() => setAssignJobOpen(true)}
              >
                <BriefcaseIcon className="size-3.5" />
                Assign to a new job
              </Button>
            </div>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              {/* Summary */}
              {parsedData?.summary && (
                <>
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Summary</SectionLabel>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {parsedData.summary}
                    </p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Skills</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex h-5 items-center rounded-full border border-border px-2 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {languages.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Languages:
                        </span>
                        {languages.map(lang => (
                          <span key={lang} className="text-xs font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                    {certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {certifications.map(cert => (
                          <span
                            key={cert}
                            className="inline-flex h-5 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 text-xs font-medium text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-300"
                          >
                            <StarIcon className="size-2.5" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Experience</SectionLabel>
                    <ExperienceTimeline items={experience} />
                  </div>
                  <Separator />
                </>
              )}

              {/* Education */}
              {education.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Education</SectionLabel>
                    <EducationList items={education} />
                  </div>
                  <Separator />
                </>
              )}

              {/* Resume & Intro Video */}
              <div className="flex flex-col gap-3">
                <SectionLabel>Resume & Intro Video</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                  <ResumeViewer
                    url={c.resumeUrl}
                    filename={c.resumeOriginalName}
                  />
                  {c.videoIntroUrl ? (
                    <IntroVideo
                      url={c.videoIntroUrl}
                      source={c.videoIntroSource}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/20 h-96 p-4 text-center">
                      <VideoIcon className="size-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        No intro video available.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio — always shown so an absent portfolio is visible */}
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <SectionLabel>Portfolio</SectionLabel>
                  <PortfolioSection
                    url={c.portfolioUrl}
                    fileUrl={c.portfolioFileUrl}
                    fileName={c.portfolioFileName}
                  />
                </div>
              </>

              {/* CRM Profile */}
              {c.crmProfile && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <SectionLabel>CRM Profile</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {c.crmProfile.workloadLevel && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Workload
                          </p>
                          <Badge variant="outline" className="w-fit capitalize">
                            {c.crmProfile.workloadLevel}
                          </Badge>
                        </div>
                      )}
                      {c.crmProfile.satisfactionScore != null && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Satisfaction
                          </p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={cn(
                                  'size-3.5',
                                  i < c.crmProfile!.satisfactionScore!
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {c.crmProfile.lastVaCheckin && (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-muted-foreground">
                            Last VA Check-in
                          </p>
                          <p className="text-xs font-medium">
                            {c.crmProfile.lastVaCheckin}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.crmProfile.burnoutRiskFlag && (
                        <div className="flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/20 dark:text-orange-300">
                          <AlertTriangleIcon className="size-3.5" />
                          Burnout Risk
                        </div>
                      )}
                      {c.crmProfile.replacementRiskFlag && (
                        <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1 text-xs font-medium text-destructive">
                          <AlertCircleIcon className="size-3.5" />
                          Replacement Risk
                        </div>
                      )}
                    </div>
                    {c.crmProfile.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.crmProfile.notes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Separator className="my-8" />

            {/* Activity Log */}
            <div className="flex flex-col gap-3">
              <SectionLabel>Activity Log</SectionLabel>
              <ActivityTimeline
                resourceType="candidate"
                resourceId={c._id}
                compact
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Created{' '}
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <Button
                variant="outline"
                className="ml-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AssignJobDialog
        open={assignJobOpen}
        onClose={() => setAssignJobOpen(false)}
        onConfirm={handleAssignToJob}
        jobs={openJobs}
      />

      {/* Remove from talent pool confirmation */}
      <Dialog
        open={removePoolConfirmOpen}
        onOpenChange={v => !v && setRemovePoolConfirmOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove from Talent Pool</DialogTitle>
            <DialogDescription className="flex flex-col gap-3 pt-2">
              <p>
                You are about to remove{' '}
                <span className="font-medium text-foreground">
                  {`${c.firstName} ${c.lastName}`}
                </span>{' '}
                from the talent pool.
              </p>
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
                They will no longer appear in saved candidates. Nothing else
                changes — their profile and history are kept.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemovePoolConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFromTalentPool}>
              Remove from pool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
