import { CommandIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Slim, glassy top bar for the home page only — brand on the left, sign-in on
 * the right.  Intentionally minimal; the auth layout handles real auth.
 */
export function HomeTopbar() {
  return (
    <header className="sticky top-0 z-30 shrink-0 bg-background/60 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
          to="/ats"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CommandIcon className="size-4" />
          </span>
          <span>Arista ATS</span>
        </Link>
        <Link
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          to="/careers"
        >
          Careers
        </Link>
      </div>
    </header>
  );
}
