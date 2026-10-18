import { Badge } from '@/components/ui/badge';
import { SparklesIcon } from 'lucide-react';

/** Subtle marker showing a field was populated by AI and is still untouched. */
export function AiBadge() {
  return (
    <Badge
      variant="secondary"
      className="gap-0.5 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary"
    >
      <SparklesIcon className="size-2.5" />
      AI
    </Badge>
  );
}
