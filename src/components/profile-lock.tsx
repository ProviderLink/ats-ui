import { useProfileLocked } from '@/lib/profile-lock-context';
import { cn } from '@/lib/utils';

/**
 * Wraps controls that change data. While the profile is locked the subtree is
 * `inert` (no clicks, focus or keyboard activation) and dimmed.
 */
export function LockableRegion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const locked = useProfileLocked();
  return (
    <div
      inert={locked}
      className={cn(locked && 'opacity-60 select-none', className)}
    >
      {children}
    </div>
  );
}
