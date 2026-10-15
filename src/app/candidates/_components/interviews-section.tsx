import type { CreateFeedbackDto, Interview } from '@/store/types';
import { InterviewCard } from './interview-card';
import { SectionLabel } from './section-label';

interface InterviewsSectionProps {
  interviews: Interview[];
  users: { _id: string; firstName: string; lastName: string }[];
  onComplete: (iv: Interview, id: string, data: CreateFeedbackDto) => Promise<void>;
  onReschedule: (iv: Interview) => void;
  onCancel: (iv: Interview, id: string) => Promise<void>;
}

export function InterviewsSection({
  interviews,
  users,
  onComplete,
  onReschedule,
  onCancel,
}: InterviewsSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SectionLabel>Interviews</SectionLabel>
        <span className="text-xs text-muted-foreground">
          ({interviews.length})
        </span>
      </div>
      {interviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No interviews scheduled yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {interviews.map(iv => (
            <InterviewCard
              key={iv._id}
              iv={iv}
              users={users}
              onComplete={onComplete}
              onReschedule={onReschedule}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
