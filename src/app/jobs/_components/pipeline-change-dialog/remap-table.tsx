import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StageShape } from '@/store';
import type { RemapRow } from '../../_utils/pipeline-change';

interface RemapTableProps {
  rows: RemapRow[];
  newStages: StageShape[];
  onSelect: (oldStageName: string, newStageName: string) => void;
  onBack: () => void;
}

export function RemapTable({
  rows,
  newStages,
  onSelect,
  onBack,
}: RemapTableProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Map each old stage to a new stage. Select where each group of candidates
        should land.
      </p>
      <div className="rounded-md border">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
          <span>Old Stage</span>
          <span className="text-center">#</span>
          <span>New Stage</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {rows.map(row => (
            <div
              key={row.oldStageName}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center px-3 py-2 border-b last:border-b-0 text-sm"
            >
              <span className="truncate">{row.oldStageName}</span>
              <Badge
                variant="secondary"
                className="h-5 w-8 justify-center text-[11px] shrink-0"
              >
                {row.candidateCount}
              </Badge>
              <Select
                value={row.selectedNewStageName}
                onValueChange={value => onSelect(row.oldStageName, value)}
              >
                <SelectTrigger className="h-8 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {newStages.map(ns => (
                    <SelectItem key={ns._id} value={ns.name}>
                      {ns.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to summary
      </button>
    </div>
  );
}
