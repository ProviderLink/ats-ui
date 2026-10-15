import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BanIcon, GitCommitHorizontalIcon, MailIcon, StarIcon, UserMinusIcon, XIcon } from 'lucide-react';
import type { CandidateTabValue } from '../_utils/candidate-tabs';

interface BulkSelectionBarProps {
  activeTab: CandidateTabValue;
  selectedCount: number;
  bulkActing: boolean;
  onMoveStage: () => void;
  onReject: () => void;
  onRemoveFromJob: () => void;
  onTalentPool: () => void;
  onEmail: () => void;
  onClear: () => void;
}

export function BulkSelectionBar({
  activeTab,
  selectedCount,
  bulkActing,
  onMoveStage,
  onReject,
  onRemoveFromJob,
  onTalentPool,
  onEmail,
  onClear,
}: BulkSelectionBarProps) {
  return (
  <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
    <Badge variant="secondary" className="text-xs">
      {selectedCount} selected
    </Badge>

    {activeTab === 'approved' && (
      <Button
        size="sm"
        variant="outline"
        onClick={onMoveStage}
      >
        <GitCommitHorizontalIcon className="size-4" />
        Move to Stage
      </Button>
    )}

    <Button
      size="sm"
      variant="outline"
      onClick={onReject}
    >
      <BanIcon className="size-4" />
      Reject
    </Button>

    {activeTab === 'approved' && (
      <Button
        size="sm"
        variant="outline"
        onClick={onRemoveFromJob}
        disabled={bulkActing}
      >
        <UserMinusIcon className="size-4" />
        Remove from Job
      </Button>
    )}

    <Button
      size="sm"
      variant="outline"
      onClick={onTalentPool}
      disabled={bulkActing}
    >
      <StarIcon className="size-4" />
      Add to Talent Pool
    </Button>

    <Button size="sm" variant="outline" onClick={onEmail}>
      <MailIcon className="size-4" />
      Email
    </Button>

    <Button
      size="sm"
      variant="ghost"
      className="ml-auto text-muted-foreground"
      onClick={onClear}
    >
      <XIcon className="size-4" />
      Clear
    </Button>
  </div>
  );
}
