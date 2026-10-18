import { TagsSelector } from '@/components/tags-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { avatarBg } from '@/lib/candidate-styles';
import { getTagIds } from '@/lib/tags';
import { cn } from '@/lib/utils';
import type { Candidate, Tag } from '@/store/types';
import {
  BriefcaseIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  XIcon,
} from 'lucide-react';

interface TalentPoolSheetHeaderProps {
  candidate: Candidate;
  allTags: Tag[];
  mutating: boolean;
  onUpdateTags: (tagIds: string[]) => void;
  onRemoveFromPool: () => void;
  onAssign: () => void;
}

export function TalentPoolSheetHeader({
  candidate: c,
  allTags,
  mutating,
  onUpdateTags,
  onRemoveFromPool,
  onAssign,
}: TalentPoolSheetHeaderProps) {
  const fullName = `${c.firstName} ${c.lastName}`;
  const latestRole = c.parsedData?.experience?.[0]?.title;

  return (
    <SheetHeader className="relative shrink-0 gap-4 overflow-hidden border-b px-6 py-5">
      {/* Decorative dot-grid in the top-right corner, behind the content. */}
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
      {/* The visible name and avatar below give the sheet no accessible name. */}
      <SheetTitle className="sr-only">{`Candidate: ${fullName}`}</SheetTitle>
      <SheetDescription className="sr-only">
        Talent pool candidate profile, resume and activity.
      </SheetDescription>

      <div className="flex items-start gap-4">
        {/* The border keeps the first avatar tile visible in dark mode, where
            its background equals the sheet's own. */}
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
              avatarBg(c.firstName)
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
            {latestRole && (
              <p
                className="mt-0.5 truncate text-sm text-muted-foreground"
                title={latestRole}
              >
                {latestRole}
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
        <TagsSelector
          allTags={allTags}
          selectedIds={getTagIds(c.tags)}
          onChange={onUpdateTags}
          compact
        />
      </div>

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
              onClick={onRemoveFromPool}
            >
              <XIcon className="size-3.5" />
              Remove from pool
            </Button>
          )}
          <Button size="sm" onClick={onAssign}>
            <BriefcaseIcon className="size-3.5" />
            Assign to a new job
          </Button>
        </div>
      </div>
    </SheetHeader>
  );
}
