import { ActivityTimeline } from '@/components/activity-timeline';
import type { ActivityLog, Candidate } from '@/store/types';
import { RejectionHistory } from './rejection-history';
import { SectionLabel } from './section-label';

interface CandidateActivitySectionProps {
  candidate: Candidate;
  emailActivity: ActivityLog[];
}

/**
 * System events for this person across all jobs (creation, profile edits,
 * talent pool, assignments). Per-job events live inside each ApplicationCard.
 * Shown last so it summarises the full candidate history.
 */
export function CandidateActivitySection({
  candidate,
  emailActivity,
}: CandidateActivitySectionProps) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionLabel>Candidate Activity</SectionLabel>
        <ActivityTimeline
          resourceType="candidate"
          resourceId={candidate._id}
          extraLogs={emailActivity}
          compact
        />
      </div>

      {/* Filtered from the same ActivityLog; a compact summary when reject
          events exist. */}
      <RejectionHistory
        candidateId={candidate._id}
        refreshKey={candidate.updatedAt}
      />
    </>
  );
}
