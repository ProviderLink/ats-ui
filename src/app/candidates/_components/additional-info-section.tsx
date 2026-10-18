import { Separator } from '@/components/ui/separator';
import type { Candidate } from '@/store/types';
import { MapPinIcon } from 'lucide-react';
import { EnglishProficiencyBadge } from './english-proficiency-badge';
import { SectionLabel } from './section-label';

export function AdditionalInfoSection({ candidate: c }: { candidate: Candidate }) {
  const hasInfo =
    c.englishProficiency ||
    c.cityOfResidence ||
    c.currentSalaryPHP != null ||
    c.currentSalaryUSD != null ||
    c.reasonForLeaving;
  if (!hasInfo) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionLabel>Additional Info</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {c.englishProficiency && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                English Proficiency
              </span>
              <EnglishProficiencyBadge
                level={c.englishProficiency}
              />
            </div>
          )}
          {c.cityOfResidence && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                City of Residence
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPinIcon className="size-3.5 text-muted-foreground" />
                {c.cityOfResidence}
              </span>
            </div>
          )}
          {c.currentSalaryPHP != null && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Current Salary (PHP)
              </span>
              <span className="font-medium">
                ₱{c.currentSalaryPHP.toLocaleString()}
              </span>
            </div>
          )}
          {c.currentSalaryUSD != null && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Current Salary (USD)
              </span>
              <span className="font-medium">
                ${c.currentSalaryUSD.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        {c.reasonForLeaving && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Reason for Leaving
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {c.reasonForLeaving}
            </p>
          </div>
        )}
      </div>
      <Separator />
    </>
  );
}
