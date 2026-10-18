import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MailIcon, XIcon } from 'lucide-react';

interface HiredBulkBarProps {
  selectedCount: number;
  onEmail: () => void;
  onClear: () => void;
}

export function HiredBulkBar({
  selectedCount,
  onEmail,
  onClear,
}: HiredBulkBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs shrink-0">
      <Badge variant="secondary" className="text-xs">
        {selectedCount} selected
      </Badge>

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
