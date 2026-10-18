import { EducationList } from '@/app/candidates/_components/education-list';
import { ExperienceTimeline } from '@/app/candidates/_components/experience-timeline';
import { IntroVideo } from '@/app/candidates/_components/intro-video';
import { SectionLabel } from '@/app/candidates/_components/section-label';
import { AssignJobDialog } from '@/components/assign-job-dialog';
import { ActivityTimeline } from '@/components/activity-timeline';
import { useCandidateEmailActivity } from '@/hooks/use-candidate-email-activity';
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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { logOptimisticActivity } from '@/lib/activity';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import { useCandidateStore } from '@/store/slices/candidates.store';
import { useJobStore } from '@/store/slices/jobs.store';
import { useTagStore } from '@/store/slices/tags.store';
import type { Candidate } from '@/store/types';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { avatarBg } from '@/lib/candidate-styles';
import { TalentPoolNotesEditor } from './talent-pool-notes-editor';

/** Radix Select forbids an empty-string item value, so the "use the first
 * stage" option needs a non-empty sentinel that we map back to undefined. */
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

  const emailActivity = useCandidateEmailActivity(
    (current ?? candidate)?._id
  );

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
          {/*
            `px-6` matches the body/footer so the header content lines up with
            everything below it. The close button is absolutely positioned at
            the sheet's top-right, so no extra right padding is reserved for it
            — `pr-14` only made the right gutter 32px wider than the left one.
          */}
          <SheetHeader className="relative shrink-0 gap-4 overflow-hidden border-b px-6 py-5">
            {/*
              Decorative dot-grid tucked into the top-right corner, clipped by
              the header and faded with a mask so it reads as a crescent along
              the sheet's rounded corner. The fill is a repeating
              `radial-gradient` dot lattice (`background-size` steps it) rather
              than a gradient wash, so it stays a crisp pattern instead of a
              blur. `-z-10` sits it behind the header's content because it is a
              child of the header's stacking context, not a floated overlay.
              Purely presentational; `aria-hidden` keeps it out of the
              accessibility tree.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 -z-10 size-56 rounded-full"
              style={{
                backgroundImage:
                  'radial-gradient(color-mix(in oklab, var(--primary) 20%, transparent) 1px, transparent 1px)',
                backgroundSize: '11px 11px',
                maskImage:
                  'radial-gradient(circle at 50% 50%, black 45%, transparent 78%)',
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, black 45%, transparent 78%)',
              }}
            />
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

            {/* Identity */}
            <div className="flex items-start gap-4">
              {/*
                A hairline `border-border` edge on both avatar variants. The
                first `AVATAR_BG` tile is `dark:bg-pine-teal-900`, which is
                *exactly* the dark-mode `--popover` — i.e. the sheet's own
                background — so that tile was invisible in dark mode and only
                the initials showed. Matches the house avatar standard in
                `ui/avatar.tsx` (`after:border-border`).
              */}
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={fullName}
                  className="size-14 shrink-0 rounded-xl border border-border object-cover"
                />
              ) : (
                <div
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-semibold select-none',
                    bg
                  )}
                >
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="min-w-0">
                  <p
                    className="truncate text-base font-semibold leading-tight"
                    title={fullName}
                  >
                    {fullName}
                  </p>
                  {parsedData?.experience?.[0] && (
                    <p
                      className="mt-0.5 truncate text-sm text-muted-foreground"
                      title={parsedData.experience[0].title}
                    >
                      {parsedData.experience[0].title}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-foreground"
                    title={c.email}
                  >
                    <MailIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </a>
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 shrink-0" />
                    {c.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BriefcaseIcon className="size-3.5 shrink-0" />
                    {c.yearsOfExperience} yrs exp
                  </span>
                </div>
              </div>
            </div>

            {/* Status · tags
                Full width on their own row(s) — this is the only thing in the
                header that grows, so it absorbs all the wrapping. */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
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
              {/*
                Read from `c` (the live store item), not the `candidate` prop
                snapshot — the prop is frozen at sheet-open time, so a tag
                added here updated the table row but not this header.
              */}
              <TagsSelector
                allTags={allTags}
                selectedIds={getTagIds(c.tags)}
                onChange={handleUpdateTags}
                compact
              />
            </div>

            {/* Meta · actions — date on the left, buttons on the right */}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              {c.talentPoolAddedAt && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarIcon className="size-3.5 shrink-0" />
                  Added to talent pool on{' '}
                  {new Date(c.talentPoolAddedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}

              <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                {c.inTalentPool && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={mutating}
                    onClick={() => setRemovePoolConfirmOpen(true)}
                  >
                    <XIcon className="size-3.5" />
                    Remove from pool
                  </Button>
                )}
                <Button size="sm" onClick={() => setAssignJobOpen(true)}>
                  <BriefcaseIcon className="size-3.5" />
                  Assign to a new job
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-6">
              {/* Talent pool notes */}
              {c.inTalentPool && (
                <>
                  <div className="flex flex-col gap-3">
                    <SectionLabel>Talent Pool Notes</SectionLabel>
                    <TalentPoolNotesEditor
                      notes={c.talentPoolNotes ?? ''}
                      mutating={mutating}
                      onSave={handleUpdatePoolNotes}
                    />
                  </div>
                  <Separator />
                </>
              )}

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

              {/*
                Additional Info — compensation and reason for leaving.

                Rendered ALWAYS (with "Not provided" fallbacks) rather than only
                when values exist, matching the Portfolio section's convention:
                a hidden section is indistinguishable from a missing feature, so
                a recruiter could not tell whether the candidate declined to
                answer or the field simply was not shown. Mirrors the labels and
                layout used in `candidate-detail-sheet.tsx`.
              */}
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <SectionLabel>Additional Info</SectionLabel>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Current Salary (PHP)
                      </span>
                      {c.currentSalaryPHP != null ? (
                        <span className="font-medium">
                          ₱{c.currentSalaryPHP.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Current Salary (USD)
                      </span>
                      {c.currentSalaryUSD != null ? (
                        <span className="font-medium">
                          ${c.currentSalaryUSD.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Reason for Leaving
                    </span>
                    <p
                      className={cn(
                        'text-sm leading-relaxed',
                        c.reasonForLeaving
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {c.reasonForLeaving || 'Not provided'}
                    </p>
                  </div>
                </div>
              </>

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
                extraLogs={emailActivity}
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
