import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ChevronRightIcon } from 'lucide-react';

interface ReasonAdvancedOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicableStages: string;
  onApplicableStagesChange: (value: string) => void;
  requireInternalNotes: boolean;
  onRequireInternalNotesChange: (value: boolean) => void;
}

export function ReasonAdvancedOptions({
  open,
  onOpenChange,
  applicableStages,
  onApplicableStagesChange,
  requireInternalNotes,
  onRequireInternalNotesChange,
}: ReasonAdvancedOptionsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRightIcon
            className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          />
          Advanced
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-5 pt-5">
          <div className="flex flex-col gap-2">
            <Label>Applicable stages</Label>
            <Input
              value={applicableStages}
              onChange={e => onApplicableStagesChange(e.target.value)}
              placeholder="e.g. Shortlisted, Interview"
            />
            <p className="text-xs text-muted-foreground">
              Stage names must match your pipeline exactly. Leave empty to offer
              this reason at every stage.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Require internal notes</p>
              <p className="text-xs text-muted-foreground">
                Recruiters must add notes when choosing this reason
              </p>
            </div>
            <Switch
              checked={requireInternalNotes}
              onCheckedChange={onRequireInternalNotesChange}
              aria-label="Require internal notes"
              className="shrink-0"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
