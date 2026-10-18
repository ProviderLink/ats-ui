import type { Candidate } from '@/store/types';

export function TalentPoolNotesCell({ candidate }: { candidate: Candidate }) {
  const notes = candidate.talentPoolNotes?.trim();
  if (!notes) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-xs text-muted-foreground line-clamp-3 whitespace-normal block">
      {notes}
    </span>
  );
}
