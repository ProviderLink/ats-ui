import { HomeBackground } from './_components/home-background';
import { HomeHero } from './_components/home-hero';
import { HomeTopbar } from './_components/home-topbar';

/**
 * Public landing page — Arista ATS console at /ats.
 *
 * A subtle, static GitHub-contribution grid sits behind a centered hero.
 * Auth-agnostic; the "Enter workspace" button routes to `/ats/dashboard`,
 * which `ProtectedRoute` will redirect to `/ats/login` when the user is
 * not yet authenticated.
 */
export default function HomePage() {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <HomeBackground />
      <div className="relative z-10 flex w-full flex-1 flex-col overflow-y-auto">
        <HomeTopbar />
        <main className="flex w-full flex-1 flex-col justify-center px-4 py-10 sm:px-6 lg:px-10 lg:py-12">
          <HomeHero />
        </main>
        <footer className="shrink-0">
          <div className="w-full px-4 pb-5 pt-5 text-center text-xs text-muted-foreground sm:px-6 lg:px-10">
            © {new Date().getFullYear()} Arista ATS · Internal console
          </div>
        </footer>
      </div>
    </div>
  );
}
