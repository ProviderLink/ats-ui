import type { Candidate } from '@/store/types';

export function CurrentRoleCell({ candidate }: { candidate: Candidate }) {
  const exp = candidate.parsedData?.experience?.[0];
  const role = exp?.title?.trim();
  const company = exp?.company?.trim();
  const duration = exp?.duration?.trim();

  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col min-w-0 max-w-48">
      <span className="text-sm text-foreground leading-tight line-clamp-2 whitespace-normal wrap-break-word">
        {role}
      </span>
      {company && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal wrap-break-word mt-0.5">
          {company}
        </span>
      )}
      {duration && (
        <span className="text-xs text-muted-foreground leading-tight whitespace-normal wrap-break-word mt-0.5 tp-duration">
          {duration}
        </span>
      )}
    </div>
  );
}
