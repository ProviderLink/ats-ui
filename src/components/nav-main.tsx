import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUnreadEmailCount } from '@/hooks/use-unread-emails';
import { CirclePlusIcon, MailIcon } from 'lucide-react';
import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

function CollapsedTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  const { state } = useSidebar();
  if (state !== 'collapsed') return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}) {
  const { pathname } = useLocation();

  function isActive(url: string) {
    const segment = url.split('/').filter(Boolean)[1] ?? '';
    return pathname.split('/').filter(Boolean)[1] === segment;
  }

  // Live unread count, derived from the email store. This used to be copied into
  // local state by an effect, which just added a render pass without changing
  // the value — the hook is already reactive.
  const { unreadCount } = useUnreadEmailCount();

  const emailsActive = pathname.split('/').filter(Boolean)[1] === 'emails';
  const quickImportActive = pathname === '/ats/candidates/quick-import';

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-6">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
            <CollapsedTooltip label="Quick Import">
              <Button
                asChild
                variant="ghost"
                className={`h-10 min-w-10 flex-1 justify-start pl-1.75 hover:border hover:border-input group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0${quickImportActive ? ' border border-input bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
              >
                <Link to="/ats/candidates/quick-import">
                  <CirclePlusIcon />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Quick Import
                  </span>
                </Link>
              </Button>
            </CollapsedTooltip>
            <CollapsedTooltip label="Emails">
              <span className="relative">
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className={`size-10 hover:bg-primary hover:text-primary-foreground dark:hover:bg-pine-teal-700 dark:hover:text-pine-teal-50${emailsActive ? ' bg-primary text-primary-foreground dark:bg-pine-teal-700 dark:text-pine-teal-50' : ' text-primary'}`}
                >
                  <Link to="/ats/emails">
                    <MailIcon />
                    <span className="sr-only">Emails</span>
                  </Link>
                </Button>
                {unreadCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-destructive" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {unreadCount} unread email
                      {unreadCount > 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </CollapsedTooltip>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.url)}
              >
                <Link to={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
