import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/role-labels';
import { ShieldIcon, UserIcon } from 'lucide-react';
import { ALL_ROLES } from '../../_data/team';
import {
  APP_OPTIONS,
  hasActiveFilters,
  NO_FILTERS,
  STATUS_LABELS,
  type ActiveFilter,
  type AppFilter,
  type RoleFilter,
  type TeamFilters,
} from '../../_utils/team-filters';
import { FilterChip } from '../filter-chip';
import { FilterOptions } from './filter-options';

interface TeamFiltersBarProps {
  filters: TeamFilters;
  onChange: (filters: TeamFilters) => void;
}

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...ALL_ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] })),
];

const APP_FILTER_OPTIONS = APP_OPTIONS.map(a => ({
  value: a,
  label: a === 'all' ? 'All apps' : a.toUpperCase(),
}));

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as ActiveFilter[]).map(
  s => ({ value: s, label: STATUS_LABELS[s] })
);

export function TeamFiltersBar({ filters, onChange }: TeamFiltersBarProps) {
  const { role, app, status } = filters;

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      <FilterChip
        icon={<UserIcon className="size-3" />}
        label={role !== 'all' ? `Role: ${ROLE_LABELS[role]}` : 'Role'}
        active={role !== 'all'}
      >
        <FilterOptions
          options={ROLE_OPTIONS}
          value={role}
          onChange={v => onChange({ ...filters, role: v })}
        />
      </FilterChip>

      <FilterChip
        icon={<ShieldIcon className="size-3" />}
        label={app !== 'all' ? `App: ${app.toUpperCase()}` : 'App'}
        active={app !== 'all'}
      >
        <FilterOptions<AppFilter>
          options={APP_FILTER_OPTIONS}
          value={app}
          onChange={v => onChange({ ...filters, app: v })}
        />
      </FilterChip>

      <FilterChip
        icon={<ShieldIcon className="size-3" />}
        label={status !== 'all' ? `Status: ${STATUS_LABELS[status]}` : 'Status'}
        active={status !== 'all'}
      >
        <FilterOptions
          options={STATUS_OPTIONS}
          value={status}
          onChange={v => onChange({ ...filters, status: v })}
        />
      </FilterChip>

      {hasActiveFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => onChange(NO_FILTERS)}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
