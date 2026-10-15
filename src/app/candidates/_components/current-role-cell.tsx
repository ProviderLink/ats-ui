import type { Candidate } from '@/store/types';

export function CurrentRoleCell({ candidate }: { candidate: Candidate }) {
  const exp = candidate.parsedData?.experience?.[0];
  const role = exp?.title?.trim();
  const company = exp?.company?.trim();
  const duration = exp?.duration?.trim();

  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm text-foreground leading-tight whitespace-normal">
        {role}
      </span>
      {company && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal mt-0.5">
          {company}
        </span>
      )}
      {duration && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal mt-0.5 tp-duration">
          {duration}
        </span>
      )}
    </div>
  );
}
