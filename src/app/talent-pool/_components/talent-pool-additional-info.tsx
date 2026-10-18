import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/store/types';
import { SectionLabel } from '@/app/candidates/_components/section-label';

/**
 * Always rendered, with "Not provided" fallbacks: a hidden section is
 * indistinguishable from a missing feature, so a recruiter could not tell
 * whether the candidate declined to answer or the field was not shown.
 */
export function TalentPoolAdditionalInfo({
  candidate: c,
}: {
  candidate: Candidate;
}) {
  return (
    <>
      <Separator />
      <div className="flex flex-col gap-3">
        <SectionLabel>Additional Info</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Salary label="Current Salary (PHP)" symbol="₱" value={c.currentSalaryPHP} />
          <Salary label="Current Salary (USD)" symbol="$" value={c.currentSalaryUSD} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Reason for Leaving
          </span>
          <p
            className={cn(
              'text-sm leading-relaxed',
              c.reasonForLeaving ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {c.reasonForLeaving || 'Not provided'}
          </p>
        </div>
      </div>
    </>
  );
}

function Salary({
  label,
  symbol,
  value,
}: {
  label: string;
  symbol: string;
  value: number | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value != null ? (
        <span className="font-medium">
          {symbol}
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-muted-foreground">Not provided</span>
      )}
    </div>
  );
}
