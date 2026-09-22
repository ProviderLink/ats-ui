import * as React from 'react';
import { Link } from 'react-router-dom';

import { NavGroup } from '@/components/nav-group';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/use-permission';
import { useAuthStore } from '@/store/slices/auth.store';
import {
  BookmarkCheckIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  ExternalLinkIcon,
  HomeIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ShieldAlertIcon,
  TagIcon,
  UserCheckIcon,
  UserRoundSearchIcon,
  UsersIcon,
} from 'lucide-react';

const data = {
  navMain: [
    { title: 'Clients', url: '/ats/clients', icon: <Building2Icon /> },
    { title: 'Jobs', url: '/ats/jobs', icon: <BriefcaseIcon /> },
    {
      title: 'Candidates',
      url: '/ats/candidates',
      icon: <UserRoundSearchIcon />,
    },
    {
      title: 'Talent Pool',
      url: '/ats/talent-pool',
      icon: <BookmarkCheckIcon />,
    },
    {
      title: 'Hired',
      url: '/ats/hired',
      icon: <UserCheckIcon />,
    },
    {
      title: 'Ineligible',
      url: '/ats/permanently-ineligible',
      icon: <ShieldAlertIcon />,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/ats/settings/general',
      icon: <Settings2Icon />,
    },
    { title: 'Tags', url: '/ats/tags', icon: <TagIcon /> },
  ],
  navInternals: [
    {
      title: 'Dashboard',
      url: '/ats/dashboard',
      icon: <LayoutDashboardIcon />,
    },
    { title: 'Team', url: '/ats/team', icon: <UsersIcon /> },
    { title: 'Calendar', url: '/ats/calendar', icon: <CalendarIcon /> },
  ],
  navPublic: [
    { title: 'Home Page', url: '/ats', icon: <HomeIcon /> },
    { title: 'Jobs Page', url: '/careers', icon: <ExternalLinkIcon /> },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasPermission } = usePermission();
  const user = useAuthStore(s => s.user);

  const filteredNavMain = data.navMain.filter(item => {
    if (item.title === 'Clients') return hasPermission('clients', 'read');
    if (item.title === 'Jobs') return hasPermission('jobs', 'read');
    if (
      item.title === 'Candidates' ||
      item.title === 'Talent Pool' ||
      item.title === 'Hired'
    )
      return hasPermission('candidates', 'read');
    if (item.title === 'Ineligible') return user?.roles.includes('admin');
    return true;
  });

  const filteredNavSecondary = data.navSecondary.filter(item => {
    if (item.title === 'Settings') return hasPermission('settings', 'read');
    if (item.title === 'Tags') return hasPermission('tags', 'read');
    return true;
  });

  const filteredNavInternals = data.navInternals.filter(item => {
    if (item.title === 'Dashboard') return hasPermission('dashboard', 'read');
    if (item.title === 'Team') return hasPermission('team', 'read');
    if (item.title === 'Calendar') return hasPermission('interviews', 'read');
    return true;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/ats/dashboard" className="flex items-center gap-2">
                <img
                  src="/arista-ats.png"
                  alt="Arista ATS"
                  className="size-5 rounded-sm object-contain"
                />
                <span className="text-base font-semibold">Arista ATS.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavGroup items={filteredNavInternals} label="Internals" />
        <NavGroup items={data.navPublic} label="Public" />
        <NavGroup items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
