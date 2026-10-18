import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

interface EmailsEmptyStateProps {
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function EmailsEmptyState({
  hasActiveFilters,
  onResetFilters,
}: EmailsEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <SearchIcon className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No emails found</p>
        <p className="text-xs text-muted-foreground">
          {hasActiveFilters
            ? 'Try adjusting your filters or search query.'
            : 'No emails have been sent or received yet.'}
        </p>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onResetFilters}
          >
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
