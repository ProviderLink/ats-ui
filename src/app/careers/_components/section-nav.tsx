import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export interface NavSection {
  id: string;
  label: string;
}

/** Sticky "on this page" nav: pills on mobile, a vertical list on desktop. */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const update = () => {
      const line = window.innerHeight * 0.3;
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      const current = nearBottom
        ? sections[sections.length - 1]
        : sections.findLast(({ id }) => {
            const el = document.getElementById(id);
            return el && el.getBoundingClientRect().top <= line;
          });
      setActive(current?.id ?? sections[0]?.id);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [sections]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-0 z-10 -mx-6 overflow-x-auto [scrollbar-width:none] bg-careers/95 px-6 py-3 backdrop-blur sm:-mx-10 sm:px-10 lg:top-8 lg:mx-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
    >
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {sections.map(({ id, label }) => (
          <li key={id} className="shrink-0">
            <a
              href={`#${id}`}
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                'block rounded-full px-3.5 py-1.5 text-sm transition-colors lg:rounded-md lg:border-l-2 lg:rounded-l-none lg:px-4',
                active === id
                  ? 'bg-careers-accent font-medium text-careers lg:border-careers-accent lg:bg-transparent lg:text-careers-accent'
                  : 'bg-white/10 text-white/70 hover:text-white lg:border-white/15 lg:bg-transparent'
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
