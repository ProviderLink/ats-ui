import { TimezoneSelect } from '@/components/timezone-select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react';
import { useState } from 'react';
import { InterviewerPicker } from './interviewer-picker';

interface AdvancedOptionsProps {
  title: string;
  onTitleChange: (title: string) => void;
  users: { _id: string; firstName: string; lastName: string }[];
  interviewerIds: string[];
  onInterviewerIdsChange: (ids: string[]) => void;
  currentUserId?: string;
  timezone: string;
}

export function AdvancedOptions({
  title,
  onTitleChange,
  users,
  interviewerIds,
  onInterviewerIdsChange,
  currentUserId,
  timezone,
}: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start px-0 hover:bg-transparent text-muted-foreground"
        >
          <SlidersHorizontalIcon className="size-3.5" />
          More options
          <ChevronDownIcon
            className={cn(
              'size-3.5 transition-transform',
              open && 'rotate-180'
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 pt-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="si-title">Title</Label>
          <Input
            id="si-title"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
          />
        </div>

        <InterviewerPicker
          users={users}
          selectedIds={interviewerIds}
          currentUserId={currentUserId}
          onChange={onInterviewerIdsChange}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="si-tz">Timezone</Label>
          <TimezoneSelect
            id="si-tz"
            value={timezone}
            onValueChange={() => {}}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Interviews always use the company timezone.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
