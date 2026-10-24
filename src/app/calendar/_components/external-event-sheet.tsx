import { ConfirmDialog } from '@/components/confirm-dialog';
import { MeetingTypeLabel } from '@/components/meeting-type-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  EXTERNAL_MEETING_BADGE,
  EXTERNAL_MEETING_STATUS_LABELS,
  EXTERNAL_MEETING_STATUS_STYLES,
} from '@/lib/external-meeting-styles';
import { cn } from '@/lib/utils';
import { withToast } from '@/lib/with-toast';
import { useExternalMeetingStore } from '@/store/slices/external-meetings.store';
import type { ExternalMeeting } from '@/store/types';
import {
  ClockIcon,
  CopyIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  NotebookTextIcon,
  PhoneIcon,
  TagIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  formatScheduledAt,
  getInterviewEndTime,
  getInterviewStartTime,
} from '../_utils/calendar-helpers';
import { EventDetailRow } from './event-detail-row';

interface ExternalEventSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: ExternalMeeting | null;
  onEdit: () => void;
}

function copyLink(link: string) {
  navigator.clipboard.writeText(link);
  toast.success('Link copied to clipboard');
}

/** Read-only detail for an external meeting, with the few actions it supports. */
export function ExternalEventSheet({
  open,
  onOpenChange,
  event,
  onEdit,
}: ExternalEventSheetProps) {
  const update = useExternalMeetingStore(s => s.update);
  const cancel = useExternalMeetingStore(s => s.cancel);
  const [busy, setBusy] = useState<'complete' | 'cancel' | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // The store row is the source of truth: a status change must show at once.
  const live = useExternalMeetingStore(s =>
    event ? s.items.find(x => x._id === event._id) : undefined,
  );
  const m = live ?? event;

  async function run(
    kind: 'complete' | 'cancel',
    task: () => Promise<unknown>,
  ) {
    setBusy(kind);
    try {
      await task();
      return true;
    } catch {
      // withToast already reported the failure.
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (!m) return null;

  const startTime = getInterviewStartTime(m.scheduledAt, m.timezone);
  const endTime = getInterviewEndTime(m.scheduledAt, m.duration, m.timezone);
  const link = m.meetingDetails.link;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-dashed border-teal-500 bg-teal-50 dark:border-teal-500/40 dark:bg-teal-500/5">
            <div className="flex items-center gap-2 pr-8">
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-[10px] uppercase tracking-wide',
                  EXTERNAL_MEETING_BADGE,
                )}
              >
                <UserRoundIcon className="size-3" aria-hidden />
                External meeting
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  EXTERNAL_MEETING_STATUS_STYLES[m.status],
                )}
              >
                {EXTERNAL_MEETING_STATUS_LABELS[m.status]}
              </Badge>
            </div>
            <SheetTitle>{m.title}</SheetTitle>
            <SheetDescription>
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                {startTime} · {m.duration} min ·{' '}
                <MeetingTypeLabel
                  type={m.type}
                  className="text-sm font-normal text-muted-foreground"
                />
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
            <EventDetailRow icon={UserRoundIcon}>
              <span className="font-medium">{m.personName}</span>
            </EventDetailRow>
            {m.personEmail && (
              <EventDetailRow icon={MailIcon}>
                <a
                  href={`mailto:${m.personEmail}`}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {m.personEmail}
                </a>
              </EventDetailRow>
            )}
            {m.personPhone && (
              <EventDetailRow icon={PhoneIcon}>
                <span>{m.personPhone}</span>
              </EventDetailRow>
            )}
            {m.jobLabel && (
              <EventDetailRow icon={TagIcon}>
                <span>
                  <span className="text-muted-foreground">Regarding: </span>
                  {m.jobLabel}
                </span>
              </EventDetailRow>
            )}

            <Separator />

            <EventDetailRow icon={ClockIcon} alignTop>
              <div>
                <p className="font-medium">
                  {formatScheduledAt(m.scheduledAt, m.timezone)}
                </p>
                <p className="text-muted-foreground">
                  {startTime} – {endTime} · {m.duration} min · {m.timezone}
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
            {m.meetingDetails.phoneNumber && (
              <EventDetailRow icon={PhoneIcon}>
                <span>{m.meetingDetails.phoneNumber}</span>
              </EventDetailRow>
            )}
            {m.meetingDetails.address && (
              <EventDetailRow icon={MapPinIcon}>
                <span>{m.meetingDetails.address}</span>
              </EventDetailRow>
            )}

            {m.attendeeIds.length > 0 && (
              <EventDetailRow icon={UsersIcon} alignTop>
                <div className="flex flex-wrap gap-1">
                  {(m.attendeeNames ?? m.attendeeIds).map((name, i) => (
                    <Badge
                      key={m.attendeeIds[i] ?? i}
                      variant="secondary"
                      className="text-xs font-medium border border-gray-300 bg-gray-200 text-gray-800 dark:border-transparent dark:bg-secondary dark:text-secondary-foreground"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </EventDetailRow>
            )}

            {m.notes && (
              <EventDetailRow icon={NotebookTextIcon} alignTop>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {m.notes}
                </p>
              </EventDetailRow>
            )}

            {m.status === 'scheduled' && (
              <>
                <Separator />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-accent"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy !== null}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      run('complete', () =>
                        withToast('Meeting marked as completed', () =>
                          update(m._id, { status: 'completed' }),
                        ),
                      )
                    }
                  >
                    {busy === 'complete' ? 'Completing...' : 'Mark as Complete'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel Meeting
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this meeting?"
        description="Your team attendees will be notified. The external person is not emailed about cancellations."
        confirmLabel="Cancel meeting"
        cancelLabel="Keep meeting"
        variant="destructive"
        loading={busy === 'cancel'}
        onConfirm={async () => {
          const ok = await run('cancel', () =>
            withToast('Meeting cancelled — team notified', () => cancel(m._id)),
          );
          if (ok) setConfirmCancel(false);
        }}
      />
    </>
  );
}
