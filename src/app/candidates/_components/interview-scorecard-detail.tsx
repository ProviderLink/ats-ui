/**
 * Read-only detail view of a single interview scorecard.
 *
 * Container: Dialog (J7 — a Sheet inside the already-open candidate-profile
 * Sheet would nest awkwardly; Dialog is the established modal pattern in
 * this codebase and is used by `ConfirmDialog`).
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate } from '@/lib/utils';
import type {
  ExperienceSelection,
  InterviewScorecard,
} from '@/store/types/interview-scorecard.types';
import {
  EXPERIENCE_SELECTION_LABELS,
  FINAL_RECOMMENDATION_BADGE_CLASS,
  FINAL_RECOMMENDATION_LABELS,
} from '@/store/types/interview-scorecard.types';
import { StarIcon } from 'lucide-react';

interface Props {
  scorecard: InterviewScorecard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable job title for display. */
  jobTitle?: string | null;
  /** Human-readable interviewer name for display. */
  interviewerName?: string | null;
}

export function InterviewScorecardDetail({
  scorecard,
  open,
  onOpenChange,
  jobTitle,
  interviewerName,
}: Props) {
  if (!scorecard) return null;

  const sc = scorecard;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            Interview Scorecard
            <Badge
              variant="outline"
              className={cn(
                'h-5 text-xs font-medium',
                FINAL_RECOMMENDATION_BADGE_CLASS[sc.finalRecommendation]
              )}
            >
              {FINAL_RECOMMENDATION_LABELS[sc.finalRecommendation]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatDate(sc.interviewDate)} · {jobTitle ?? 'Job'} · Interviewer:{' '}
            {interviewerName ?? 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Overall score */}
          <section className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Overall Score
              </p>
              <p className="text-3xl font-semibold">
                {sc.overallScore.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <p>Server-computed on submit</p>
              <p>Immutable after creation</p>
            </div>
          </section>

          {/* Categories */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryDetail
              title="Communication"
              rating={sc.communicationRating}
              weighted={sc.communicationWeighted}
              weight={30}
              subRows={[
                {
                  label: 'English Diction',
                  value: `${sc.commEnglishDiction}/5`,
                },
                {
                  label: 'English Comprehension',
                  value: `${sc.commEnglishComprehension}/5`,
                },
              ]}
              note="Communication rating is auto-computed from the two sub-ratings."
            />

            <CategoryDetail
              title="Relevant Experience"
              rating={sc.experienceRating}
              weighted={sc.experienceWeighted}
              weight={25}
              extra={
                sc.experienceSelections.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Experience areas:
                    </span>
                    <ul className="text-xs list-disc list-inside text-muted-foreground">
                      {sc.experienceSelections.map(s => (
                        <li key={s}>
                          {EXPERIENCE_SELECTION_LABELS[
                            s as ExperienceSelection
                          ] ?? s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              }
            />

            <CategoryDetail
              title="Professionalism"
              rating={sc.professionalismRating}
              weighted={sc.professionalismWeighted}
              weight={15}
              subRows={[
                {
                  label: 'Prepared on time',
                  value: booleanLabel(sc.profPreparedOnTime),
                },
                {
                  label: 'Appearance & demeanor',
                  value: booleanLabel(sc.profAppearanceDemeanor),
                },
                {
                  label: 'Attitude & reliability',
                  value: booleanLabel(sc.profAttitudeReliability),
                },
                {
                  label: 'Interest in position',
                  value: booleanLabel(sc.profInterestInPosition),
                },
              ]}
            />

            <CategoryDetail
              title="Office & Technology Setup"
              rating={sc.technologyRating}
              weighted={sc.technologyWeighted}
              weight={20}
              subRows={[
                {
                  label: 'Internet speed adequate',
                  value: booleanLabel(sc.techInternetSpeed),
                },
                {
                  label: 'Noise-cancelling headset',
                  value: booleanLabel(sc.techHeadsetNoiseCancelling),
                },
                {
                  label: 'Two screens',
                  value: booleanLabel(sc.techTwoScreens),
                },
                {
                  label: 'Backup internet',
                  value: booleanLabel(sc.techBackupInternet),
                },
                {
                  label: 'Backup generator',
                  value: booleanLabel(sc.techBackupGenerator),
                },
              ]}
            />

            <CategoryDetail
              title="Availability & Overall Fit"
              rating={sc.availabilityRating}
              weighted={sc.availabilityWeighted}
              weight={10}
              subRows={[
                {
                  label: 'Can work US hours',
                  value: booleanLabel(sc.availUsHours),
                },
                {
                  label: 'Compensation acceptable',
                  value: booleanLabel(sc.availCompensationAcceptable),
                },
                {
                  label: 'Start availability acceptable',
                  value: booleanLabel(sc.availStartAvailability),
                },
                {
                  label: 'Overall fit',
                  value: booleanLabel(sc.availOverallFit),
                },
              ]}
            />
          </div>

          <Separator />

          {/* Notes */}
          <section className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NoteField label="Strengths" value={sc.strengths} />
              <NoteField label="Concerns" value={sc.concerns} />
              <NoteField label="General notes" value={sc.generalNotes} />
              <NoteField
                label="Recommended position"
                value={sc.recommendedPosition}
              />
              <NoteField
                label="Earliest start date"
                value={
                  sc.earliestStartDate ? formatDate(sc.earliestStartDate) : '—'
                }
              />
              <NoteField
                label="Compensation expectation"
                value={sc.compensationExpectation || '—'}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function booleanLabel(v: boolean): string {
  return v ? 'Yes' : 'No';
}

function CategoryDetail({
  title,
  rating,
  weighted,
  weight,
  subRows = [],
  extra,
  note,
}: {
  title: string;
  rating: number;
  weighted: number;
  weight: number;
  subRows?: { label: string; value: string }[];
  extra?: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            weight {weight}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={cn(
                  'size-3.5',
                  i < rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {weighted.toFixed(1)}/{weight}
          </span>
        </div>
      </div>

      {subRows.length > 0 && (
        <ul className="text-sm text-muted-foreground flex flex-col gap-1.5">
          {subRows.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{r.label}</span>
              <span className="text-foreground font-medium">{r.value}</span>
            </li>
          ))}
        </ul>
      )}

      {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
      {extra}
    </section>
  );
}

function NoteField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
