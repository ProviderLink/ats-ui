import { LockableRegion } from '@/components/profile-lock';
import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { avatarBg, getFitConfig, scoreBarColor, scoreTextColor } from '@/lib/candidate-styles';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import type { Candidate, Tag } from '@/store/types';
import { BriefcaseIcon, MailIcon, PhoneIcon, SparklesIcon, StarIcon } from 'lucide-react';

interface CandidateSheetHeaderProps {
  candidate: Candidate;
  fullName: string;
  allTags: Tag[];
  onUpdateTags: (tagIds: string[]) => void;
}

export function CandidateSheetHeader({
  candidate: c,
  fullName,
  allTags,
  onUpdateTags: handleUpdateTags,
}: CandidateSheetHeaderProps) {
  const { aiScore, aiValidation, parsedData } = c;
  const bg = avatarBg(c.firstName);
  const hasValidation = !!aiValidation && aiValidation.score != null;
  const firstRole = parsedData?.experience?.[0];
  const hasScoring =
    !!aiScore && aiScore.score != null && aiScore.recommendation != null;
  const fitCfg = getFitConfig(aiScore?.recommendation);
  const fitLabel = hasScoring ? fitCfg.label : null;
  const fitCls = hasScoring ? fitCfg.cls : '';

  return (
    <SheetHeader className="shrink-0 border-b pl-6 pr-14 py-5">
      {/*
        Visually hidden. The markup below presents the candidate's name
        and avatar directly, so without these the sheet has no accessible
        name and Radix logs a missing-Title warning. `sr-only` leaves the
        rendered design unchanged.
      */}
      <SheetTitle className="sr-only">{`Candidate: ${fullName}`}</SheetTitle>
      <SheetDescription className="sr-only">
        Candidate profile, applications, interviews and activity.
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
          {firstRole && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {firstRole.title}
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
            {fitLabel && (
              <Badge className={cn('bg-transparent font-medium', fitCls)}>
                <SparklesIcon className="size-3" />
                {fitLabel}
              </Badge>
            )}
            {!fitLabel && aiValidation && hasValidation && (
              <Badge
                className={cn(
                  'bg-transparent font-medium',
                  aiValidation.isValid
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-destructive'
                )}
              >
                <SparklesIcon className="size-3" />
                {aiValidation.isValid ? 'Valid' : 'Invalid'}
              </Badge>
            )}
            {c.inTalentPool && (
              <Badge className="border-violet-400 bg-transparent font-medium text-violet-700 dark:border-violet-400 dark:text-violet-300">
                <StarIcon className="size-3" />
                Talent Pool
              </Badge>
            )}
            <LockableRegion className="contents">
              <TagsSelector
                allTags={allTags}
                selectedIds={getTagIds(c.tags)}
                onChange={handleUpdateTags}
                compact
              />
            </LockableRegion>
          </div>
        </div>

        {(aiScore || hasValidation) && (
          <div className="shrink-0 text-right">
            <p
              className={cn(
                'text-2xl font-semibold tabular-nums leading-none',
                scoreTextColor(aiScore?.score ?? aiValidation?.score ?? 0)
              )}
            >
              {aiScore?.score ?? aiValidation?.score ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {aiScore ? 'AI Score' : 'Validation'}
            </p>
            <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full',
                  scoreBarColor(
                    aiScore?.score ?? aiValidation?.score ?? 0
                  )
                )}
                style={{
                  width: `${aiScore?.score ?? aiValidation?.score ?? 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SheetHeader>
  );
}
