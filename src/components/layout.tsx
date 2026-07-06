import { AppSidebar } from '@/components/app-sidebar';
import { SidebarErrorBoundary } from '@/components/sidebar-error-boundary';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import * as React from 'react';
import { Outlet } from 'react-router-dom';

export function Layout() {
  const [open, setOpen] = React.useState(true);

  // All data is preloaded during boot (see ProtectedRoute).
  // No per-page fetch needed — every page renders instantly from store data.

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <SidebarErrorBoundary>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <Outlet />
          </SidebarInset>
        </SidebarErrorBoundary>
      </SidebarProvider>
    </div>
  );
}
