import { SkillsCell } from '@/app/candidates/_components/skills-cell';
import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SortHeader } from '@/components/candidate-table/sort-header';
import { TagList } from '@/components/tag-list';
import { Checkbox } from '@/components/ui/checkbox';
import type { Candidate } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import { EllipsisIcon } from 'lucide-react';
import { CurrentRoleCell } from '../current-role-cell';
import { TalentPoolNotesCell } from '../talent-pool-notes-cell';
import { ExperienceCell } from './experience-cell';
import { TalentPoolRowActions } from './talent-pool-row-actions';

interface TalentPoolColumnsOptions {
  rows: Candidate[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  mutating: boolean;
  onRemove: (candidate: Candidate) => void;
  onAssign: (candidate: Candidate) => void;
  onEmail: (candidate: Candidate) => void;
}

export function buildTalentPoolColumns({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  mutating,
  onRemove,
  onAssign,
  onEmail,
}: TalentPoolColumnsOptions): ColumnDef<Candidate>[] {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={
            rows.length > 0 && rows.every(c => selectedIds.has(c._id))
              ? true
              : selectedIds.size > 0
                ? 'indeterminate'
                : false
          }
          onCheckedChange={onToggleAll}
          aria-label="Select all candidates"
        />
      ),
      cell: ({ row }) => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(row.original._id)}
            onCheckedChange={() => onToggleRow(row.original._id)}
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          />
        </div>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      id: 'candidate',
      accessorFn: row => `${row.firstName} ${row.lastName}`,
      header: ({ column }) => <SortHeader column={column} label="Candidate" />,
      cell: ({ row }) => <CandidateCell candidate={row.original} />,
      size: 200,
      minSize: 150,
    },
    {
      id: 'currentRole',
      accessorFn: row => row.parsedData?.experience?.[0]?.title ?? '',
      header: () => <ColHeader>Current Role</ColHeader>,
      cell: ({ row }) => <CurrentRoleCell candidate={row.original} />,
      size: 180,
      minSize: 130,
    },
    {
      id: 'skills',
      accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
      header: () => <ColHeader>Skills</ColHeader>,
      cell: ({ row }) => <SkillsCell candidate={row.original} />,
      size: 160,
      minSize: 100,
    },
    {
      id: 'experience',
      accessorKey: 'yearsOfExperience',
      header: ({ column }) => <SortHeader column={column} label="Exp" />,
      cell: ({ row }) => (
        <ExperienceCell years={row.original.yearsOfExperience} />
      ),
      size: 70,
      minSize: 60,
    },
    {
      id: 'tags',
      header: () => <ColHeader>Tags</ColHeader>,
      cell: ({ row }) => <TagList tags={row.original.tags} max={3} />,
      size: 120,
      minSize: 80,
    },
    {
      id: 'talentPoolNotes',
      header: () => <ColHeader>Notes</ColHeader>,
      cell: ({ row }) => <TalentPoolNotesCell candidate={row.original} />,
      size: 160,
      minSize: 150,
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex justify-center">
          <EllipsisIcon className="size-4 text-muted-foreground" />
        </div>
      ),
      cell: ({ row }) => (
        <TalentPoolRowActions
          candidate={row.original}
          mutating={mutating}
          onRemove={() => onRemove(row.original)}
          onAssign={() => onAssign(row.original)}
          onEmail={() => onEmail(row.original)}
        />
      ),
      size: 120,
      minSize: 110,
    },
  ];
}
