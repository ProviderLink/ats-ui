import { cn } from '@/lib/utils';
import { Settings2Icon, UserIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'General', href: '/ats/settings/general', icon: Settings2Icon },
  { label: 'Account', href: '/ats/account', icon: UserIcon },
];

export function SettingsNav() {
  return (
    <nav className="flex flex-col gap-0.5 w-44 shrink-0">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
        <NavLink
          key={href}
          to={href}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
