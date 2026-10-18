import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

interface ActionMenuItemProps
  extends Omit<ComponentProps<typeof DropdownMenuItem>, 'children'> {
  icon: LucideIcon;
  iconBoxClass: string;
  iconClass: string;
  title: string;
  description: string;
}

export function ActionMenuItem({
  icon: Icon,
  iconBoxClass,
  iconClass,
  title,
  description,
  ...props
}: ActionMenuItemProps) {
  return (
    <DropdownMenuItem
      className="gap-2.5 rounded-md px-2.5 py-2 cursor-pointer"
      {...props}
    >
      <span
        className={`flex items-center justify-center size-7 rounded-md shrink-0 ${iconBoxClass}`}
      >
        <Icon className={`size-3.5 ${iconClass}`} />
      </span>
      <span className="flex flex-col">
        <span className="text-sm">{title}</span>
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </span>
    </DropdownMenuItem>
  );
}

export function ActionMenuSection({ children }: { children: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5 pt-0.5">
      {children}
    </div>
  );
}
