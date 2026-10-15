import { Badge } from '@/components/ui/badge';
import { cn, formatDate, safeHttpUrl } from '@/lib/utils';
import type { CreateFeedbackDto, Interview } from '@/store/types';
import { CalendarIcon, ClockIcon, ExternalLinkIcon, MapPinIcon, StarIcon } from 'lucide-react';
import { InterviewCompleteFeedbackForm } from './interview-complete-feedback-form';

const TYPE_LABELS: Record<Interview['type'], string> = {
  zoom: 'Zoom',
  google_meet: 'Google Meet',
  phone_call: 'Phone Call',
  in_person: 'In Person',
};

interface InterviewCardProps {
  iv: Interview;
  users: { _id: string; firstName: string; lastName: string }[];
  onComplete: (iv: Interview, id: string, data: CreateFeedbackDto) => Promise<void>;
  onReschedule: (iv: Interview) => void;
  onCancel: (iv: Interview, id: string) => Promise<void>;
}

export function InterviewCard({ iv, users, onComplete, onReschedule, onCancel }: InterviewCardProps) {
  const ivInterviewers = users.filter(u => iv.interviewerIds.includes(u._id));
  const typeLabel = TYPE_LABELS[iv.type] ?? 'In Person';
  const statusCls =
    iv.status === 'scheduled'
      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300'
      : iv.status === 'completed'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
        : iv.status === 'cancelled'
          ? 'border-muted bg-muted text-muted-foreground'
          : 'border-destructive/40 bg-destructive/5 text-destructive';

  return (
    <div className="rounded-lg border p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {iv.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {typeLabel}
          </p>
        </div>
        <Badge
          className={cn(
            'h-5 text-[10px] capitalize font-medium',
            statusCls
          )}
          variant="outline"
        >
          {iv.status}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarIcon className="size-3" />
          {formatDate(iv.scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="size-3" />
          {iv.duration} min
        </span>
      </div>
      {iv.meetingDetails?.address && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="size-3 shrink-0" />
          <span className="truncate">
            {iv.meetingDetails.address}
          </span>
        </div>
      )}
      {iv.meetingDetails?.link && (
        <a
          href={safeHttpUrl(iv.meetingDetails.link)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLinkIcon className="size-3" />
          Join meeting
        </a>
      )}
      {ivInterviewers.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            Interviewers:
          </span>
          <div className="flex -space-x-1">
            {ivInterviewers.map(u => (
              <div
                key={u._id}
                className="size-5 rounded-full bg-muted border border-background flex items-center justify-center text-[9px] font-medium"
                title={`${u.firstName} ${u.lastName}`}
              >
                {u.firstName[0]}
                {u.lastName[0]}
              </div>
            ))}
          </div>
        </div>
      )}
      {iv.feedbacks.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Feedback ({iv.feedbacks.length})
          </span>
          {iv.feedbacks.map(fb => {
            const fbUser = users.find(
              u => u._id === fb.interviewerId
            );
            return (
              <div
                key={fb._id}
                className="rounded-md bg-muted/40 px-2.5 py-2 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  {fbUser && (
                    <span className="font-medium">
                      {fbUser.firstName}{' '}
                      {fbUser.lastName}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {formatDate(fb.submittedAt)}
                  </span>
                  <span className="flex items-center gap-0.5 ml-auto">
                    {Array.from({ length: 5 }).map(
                      (_, i) => (
                        <StarIcon
                          key={i}
                          className={cn(
                            'size-3',
                            i < fb.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      )
                    )}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {fb.notes}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {iv.status === 'scheduled' && (
        <InterviewCompleteFeedbackForm
          interviewId={iv._id}
          onComplete={(id, data) => onComplete(iv, id, data)}
          onReschedule={() => onReschedule(iv)}
          onCancel={id => onCancel(iv, id)}
        />
      )}
    </div>
  );
}
