import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface InterviewerPickerProps {
  users: { _id: string; firstName: string; lastName: string }[];
  selectedIds: string[];
  currentUserId?: string;
  onChange: (ids: string[]) => void;
}

export function InterviewerPicker({
  users,
  selectedIds,
  currentUserId,
  onChange,
}: InterviewerPickerProps) {
  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );

  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        Interviewers
        <span className="text-muted-foreground font-normal">
          {' '}
          (optional — you are included by default)
        </span>
      </Label>
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
        {users.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground text-center w-full">
            No interviewers available
          </p>
        ) : (
          users.map(u => {
            const selected = selectedIds.includes(u._id);
            return (
              <button
                key={u._id}
                type="button"
                aria-pressed={selected}
                className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors cursor-pointer',
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 border-muted text-muted-foreground hover:border-foreground/20'
                )}
                onClick={() => toggle(u._id)}
              >
                {selected && <CheckIcon className="size-3 shrink-0" />}
                {u.firstName} {u.lastName}
                {u._id === currentUserId && (
                  <span className="opacity-70">(you)</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
