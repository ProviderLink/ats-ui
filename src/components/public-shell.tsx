import { Outlet } from 'react-router-dom';

/**
 * Minimal shell for the public careers portal — no header chrome, just the
 * page outlet and footer.  Each careers page renders its own brand mark.
 * Auth-agnostic: works for anonymous visitors.
 */
export function PublicShell() {
  return (
    <div className="careers-theme flex w-full min-h-dvh flex-col bg-background text-foreground">
      <main className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Arista Careers. All rights reserved.
      </footer>
    </div>
  );
}
