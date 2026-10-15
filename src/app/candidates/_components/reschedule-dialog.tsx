import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getZonedDate, getZonedTime, zonedWallClockToUtc } from '@/lib/timezones';
import { useMemo, useState } from 'react';

export function RescheduleDialog({
  open,
  onClose,
  onConfirm,
  interviewTitle,
  currentDate,
  currentTimezone,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { scheduledAt: string }) => Promise<void>;
  interviewTitle: string;
  currentDate: string;
  /** IANA zone the interview was scheduled in; the wall clock is shown and
   *  re-interpreted in this zone so rescheduling never shifts the time. */
  currentTimezone?: string | null;
  loading?: boolean;
}) {
  // Only mounted while open, so the form below is seeded from initial state
  // and needs no reset effect. The key re-seeds it if the interview changes.
  if (!open) return null;
  return (
    <RescheduleForm
      key={`${interviewTitle}:${currentDate}`}
      onClose={onClose}
      onConfirm={onConfirm}
      interviewTitle={interviewTitle}
      currentDate={currentDate}
      currentTimezone={currentTimezone}
      loading={loading}
    />
  );
}

function RescheduleForm({
  onClose,
  onConfirm,
  interviewTitle,
  currentDate,
  currentTimezone,
  loading,
}: {
  onClose: () => void;
  onConfirm: (data: { scheduledAt: string }) => Promise<void>;
  interviewTitle: string;
  currentDate: string;
  currentTimezone?: string | null;
  loading?: boolean;
}) {
  const initial = useMemo(() => {
    // Both values must come from the SAME zone. Previously the date was sliced
    // out of the UTC ISO string while the time was read with local getters, so
    // the form opened on a mismatched date/time and then saved using the
    // browser's zone — every reschedule silently shifted the interview.
    return {
      date: getZonedDate(currentDate, currentTimezone),
      time: getZonedTime(currentDate, currentTimezone),
    };
  }, [currentDate, currentTimezone]);

  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);

  const isValid = Boolean(date && time);

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Reschedule Interview</DialogTitle>
          <DialogDescription className="text-xs">
            {interviewTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Time</Label>
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!isValid || loading}
            onClick={async () => {
              if (!isValid) return;
              await onConfirm({
                scheduledAt:
                  zonedWallClockToUtc(date, time, currentTimezone ?? '') ||
                  new Date(`${date}T${time}`).toISOString(),
              });
            }}
          >
            {loading ? 'Saving…' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
