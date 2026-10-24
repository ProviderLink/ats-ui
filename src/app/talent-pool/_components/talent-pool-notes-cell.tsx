import type { Candidate } from '@/store/types';

export function TalentPoolNotesCell({ candidate }: { candidate: Candidate }) {
  const notes = candidate.talentPoolNotes?.trim();
  if (!notes) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="block line-clamp-3 whitespace-normal rounded-r-md border-l-2 border-amber-500 bg-amber-100 px-2.5 py-1.5 text-xs leading-snug text-foreground/90 dark:text-foreground/75 dark:border-amber-400/50 dark:bg-amber-400/[0.06]">
      {notes}
    </span>
  );
}
