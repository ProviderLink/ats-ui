import {
  ArrowRightIcon,
  LayersIcon,
  RadioIcon,
  WorkflowIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MODULES = [
  {
    icon: WorkflowIcon,
    title: 'Candidate lifecycle',
    desc: 'From application to approval.',
  },
  {
    icon: LayersIcon,
    title: 'Pipeline orchestration',
    desc: 'Stages, interviews, offers.',
  },
  {
    icon: RadioIcon,
    title: 'Real-time sync',
    desc: 'Live across the team.',
  },
] as const;

export function HomeHero() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
      <h1 className="font-heading text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        <span className="text-foreground">Hiring,</span>{' '}
        <span className="bg-linear-to-r from-foreground to-foreground/50 bg-clip-text text-transparent dark:from-primary dark:to-primary/60">
          organized.
        </span>
      </h1>

      <p className="max-w-xl text-balance text-base text-foreground/85 sm:text-lg">
        The internal console for the team that runs the pipeline.
      </p>

      <Link
        className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-md bg-foreground px-6 text-sm font-semibold text-background shadow-lg shadow-black/15 transition-all duration-200 hover:shadow-xl hover:shadow-black/25 hover:brightness-110 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-linear-to-r dark:from-primary dark:to-primary/80 dark:text-primary-foreground dark:shadow-primary/25 dark:hover:shadow-primary/40"
        to="/ats/dashboard"
      >
        <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        Enter workspace
        <ArrowRightIcon className="size-4 relative transition-transform duration-200 group-hover:translate-x-1" />
      </Link>

      <ul className="mt-2 grid w-full gap-4 pt-2 text-left sm:grid-cols-3">
        {MODULES.map(({ icon: Icon, title, desc }) => (
          <li
            className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] p-4 text-left backdrop-blur"
            key={title}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground/10 text-foreground dark:bg-primary/10 dark:text-primary">
              <Icon className="size-4" />
            </span>
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
