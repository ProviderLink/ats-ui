import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

function getTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const segment =
    segments[0] === 'ats' ? (segments[1] ?? '') : (segments[0] ?? '');
  if (!segment) return 'Arista ATS';
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const title = getTitle(pathname);
  const isJobs = pathname.startsWith('/ats/jobs');

  return (
    <header
      className={cn(
        'flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)',
        !isJobs && 'border-b'
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="mx-2 w-px h-4 bg-border shrink-0" />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
