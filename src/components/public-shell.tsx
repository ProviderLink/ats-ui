import { cn } from '@/lib/utils';
import { Outlet, useMatch } from 'react-router-dom';

/**
 * Minimal shell for the public careers portal — no header chrome, just the
 * page outlet and footer.  Each careers page renders its own brand mark.
 * Auth-agnostic: works for anonymous visitors. The job list and detail pages
 * use the dark theme; the apply page uses it too.
 */
export function PublicShell() {
  const isList = useMatch({ path: '/careers', end: true });
  const isDetail = useMatch({ path: '/careers/:id', end: true });
  const isApply = useMatch({ path: '/careers/:id/apply', end: true });
  const isDark = Boolean(isList || isDetail || isApply);

  return (
    <div
      className={cn(
        'careers-theme flex w-full min-h-dvh flex-col bg-background text-foreground',
        isDark && 'careers-dark'
      )}
    >
      <main className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Arista Careers. All rights reserved.
      </footer>
    </div>
  );
}
