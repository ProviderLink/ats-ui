import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmailStatus } from '@/store/types';
import { PenSquareIcon, SearchIcon } from 'lucide-react';
import type { EmailTab } from '../../_hooks/use-email-list-query';
import { TabCountChip } from './tab-count-chip';

const TABS: { value: EmailTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_OPTIONS: { value: EmailStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'received', label: 'Received' },
  { value: 'sent', label: 'Sent' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

interface EmailsToolbarProps {
  tab: EmailTab;
  onTabChange: (tab: EmailTab) => void;
  tabCounts: Record<EmailTab, number>;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EmailStatus | 'all';
  onStatusFilterChange: (value: EmailStatus | 'all') => void;
  onCompose: () => void;
}

export function EmailsToolbar({
  tab,
  onTabChange,
  tabCounts,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCompose,
}: EmailsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between flex-wrap shrink-0">
      <Tabs
        value={tab}
        onValueChange={v => onTabChange(v as EmailTab)}
        className="flex-row"
      >
        <TabsList>
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} <TabCountChip n={tabCounts[t.value]} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative min-w-44 max-w-xs flex-1 sm:flex-none">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search subject, sender, recipient..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={v => onStatusFilterChange(v as EmailStatus | 'all')}
        >
          <SelectTrigger className="w-36 h-9 gap-2">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" className="gap-2" onClick={onCompose}>
          <PenSquareIcon className="size-4" />
          Compose
        </Button>
      </div>
    </div>
  );
}
