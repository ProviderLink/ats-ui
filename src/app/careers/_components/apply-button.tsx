import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ApplyButton({
  expired,
  onClick,
  className,
}: {
  expired: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      size="lg"
      disabled={expired}
      onClick={onClick}
      className={cn(
        'bg-careers-accent px-8 text-careers hover:bg-careers-accent/90',
        className
      )}
    >
      {expired ? 'Applications closed' : 'Apply now'}
    </Button>
  );
}
