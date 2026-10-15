import { Badge } from '@/components/ui/badge';

export function TabCountChip({ n }: { n: number }) {
  return (
    <Badge
      variant="outline"
      className="h-4 px-1.5 text-[10px] rounded-full border-border font-medium"
    >
      {n}
    </Badge>
  );
}
