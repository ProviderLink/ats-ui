import { Badge } from '@/components/ui/badge';
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_STYLES,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPE_STYLES,
} from '@/lib/interview-styles';
import { cn } from '@/lib/utils';
import type { Interview } from '@/store/types';
import {
  ClockIcon,
  CopyIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatScheduledAt,
  getInterviewEndTime,
  getInterviewStartTime,
} from '../_utils/calendar-helpers';
import { EventDetailRow } from './event-detail-row';

interface EventDetailInfoProps {
  event: Interview;
  candidateName?: string;
  jobTitle?: string;
  interviewerNames: Record<string, string>;
}

function copyLink(link: string) {
  navigator.clipboard.writeText(link);
  toast.success('Link copied to clipboard');
}

export function EventDetailInfo({
  event,
  candidateName,
  jobTitle,
  interviewerNames,
}: EventDetailInfoProps) {
  const startTime = getInterviewStartTime(event.scheduledAt, event.timezone);
  const endTime = getInterviewEndTime(
    event.scheduledAt,
    event.duration,
    event.timezone
  );
  const meeting = event.meetingDetails;
  const link = meeting?.link;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded border font-medium',
            INTERVIEW_TYPE_STYLES[event.type]
          )}
        >
          {INTERVIEW_TYPE_LABELS[event.type]}
        </span>
        <Badge
          variant="outline"
          className={cn('text-xs', INTERVIEW_STATUS_STYLES[event.status])}
        >
          {INTERVIEW_STATUS_LABELS[event.status]}
        </Badge>
      </div>

      {(candidateName || jobTitle) && (
        <div className="flex flex-col gap-1.5">
          {candidateName && (
            <Badge variant="secondary" className="text-xs w-fit">
              {candidateName}
            </Badge>
          )}
          {jobTitle && (
            <p className="text-sm font-medium text-foreground/80 leading-snug mt-1">
              {jobTitle}
            </p>
          )}
        </div>
      )}

      <EventDetailRow icon={ClockIcon} alignTop>
        <div>
          <p className="font-medium">
            {formatScheduledAt(event.scheduledAt, event.timezone)}
          </p>
          <p className="text-muted-foreground">
            {startTime} – {endTime} · {event.duration} min · {event.timezone}
          </p>
        </div>
      </EventDetailRow>

      {link && (
        <EventDetailRow icon={LinkIcon} alignTop>
          <div className="flex items-start gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => copyLink(link)}
              className="text-primary underline-offset-2 hover:underline text-left break-all"
            >
              {link}
            </button>
            <button
              type="button"
              onClick={() => copyLink(link)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              title="Copy link"
            >
              <CopyIcon className="size-3.5" />
            </button>
          </div>
        </EventDetailRow>
      )}

      {meeting?.phoneNumber && (
        <EventDetailRow icon={PhoneIcon}>
          <span>{meeting.phoneNumber}</span>
        </EventDetailRow>
      )}

      {meeting?.address && (
        <EventDetailRow icon={MapPinIcon}>
          <span>{meeting.address}</span>
        </EventDetailRow>
      )}

      {event.interviewerIds.length > 0 && (
        <EventDetailRow icon={UsersIcon} alignTop>
          <div className="flex flex-wrap gap-1">
            {(
              event.interviewerNames ??
              event.interviewerIds.map(id => interviewerNames[id] ?? id)
            ).map((name, i) => (
              <Badge
                key={event.interviewerIds[i] ?? i}
                variant="secondary"
                className="text-xs font-medium"
              >
                {name}
              </Badge>
            ))}
          </div>
        </EventDetailRow>
      )}
    </>
  );
}
