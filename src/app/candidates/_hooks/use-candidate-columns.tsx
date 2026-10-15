import { CandidateCell } from '@/components/candidate-table/candidate-cell';
import { ColHeader } from '@/components/candidate-table/col-header';
import { SORT_BTN_CLS, SortHeader } from '@/components/candidate-table/sort-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import type { Application, Candidate, Client, Job } from '@/store/types';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDownIcon, EllipsisIcon, SparklesIcon } from 'lucide-react';
import { useMemo } from 'react';
import type { CandidateTabValue } from '../_utils/candidate-tabs';
import { AiScoreCell } from '../_components/ai-score-cell';
import { CurrentRoleCell } from '../_components/current-role-cell';
import { JobAppliedCell } from '../_components/job-applied-cell';
import { PipelineActionsMenu } from '../_components/pipeline-actions-menu';
import { PipelineStageSelectCell } from '../_components/pipeline-stage-select-cell';
import { ReviewActionsDropdown } from '../_components/review-actions-dropdown';
import { SkillsCell } from '../_components/skills-cell';
import type { useCandidateApplicationMaps } from './use-candidate-application-maps';
import type { useCandidateBulkActions } from './use-candidate-bulk-actions';

interface ColumnsArgs {
  activeTab: CandidateTabValue;
  maps: ReturnType<typeof useCandidateApplicationMaps>;
  bulk: ReturnType<typeof useCandidateBulkActions>;
  allApps: Application[];
  allJobs: Job[];
  allClients: Client[];
  setOpenStageRowId: (id: string | null) => void;
}

/** Column definitions; they change with the tab, selection and application data. */
export function useCandidateColumns({
  activeTab,
  maps,
  bulk,
  allApps,
  allJobs,
  allClients,
  setOpenStageRowId,
}: ColumnsArgs) {
  const { jobInfosByCandidateId, stageInfoByCandidateId } = maps;
  const {
    selectedIds,
    selectedCount,
    allFilteredSelected,
    toggleSelect,
    toggleSelectAll,
  } = bulk;

  const columns = useMemo<ColumnDef<Candidate>[]>(() => {
    const isPipeline = activeTab === 'approved';

    const stageCol: ColumnDef<Candidate> = {
      id: 'currentStage',
      header: () => <ColHeader>Current Stage</ColHeader>,
      cell: ({ row }) => {
        const info = stageInfoByCandidateId.get(row.original._id);
        if (!info)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <PipelineStageSelectCell
            applicationId={info.applicationId}
            stageId={info.stageId}
            assignedAt={info.assignedAt}
            stages={info.stages}
            onOpenChange={open =>
              setOpenStageRowId(open ? row.original._id : null)
            }
          />
        );
      },
    };

    const roleCol: ColumnDef<Candidate> = {
      id: 'currentRole',
      accessorFn: row => row.parsedData?.experience?.[0]?.title ?? '',
      header: () => <ColHeader>Current Role</ColHeader>,
      cell: ({ row }) => <CurrentRoleCell candidate={row.original} />,
    };

    return [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={
              allFilteredSelected
                ? true
                : selectedCount > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={() => toggleSelectAll()}
            aria-label="Select all candidates"
          />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(row.original._id)}
              onCheckedChange={() => toggleSelect(row.original._id)}
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
        header: ({ column }) => (
          <SortHeader column={column} label="Candidate" />
        ),
        cell: ({ row }) => <CandidateCell candidate={row.original} />,
      },
      {
        id: 'jobs',
        header: () => <ColHeader>Job Applied</ColHeader>,
        cell: ({ row }) => (
          <JobAppliedCell
            candidate={row.original}
            appInfos={jobInfosByCandidateId.get(row.original._id)}
            allJobs={allJobs}
            allClients={allClients}
          />
        ),
      },
      ...(isPipeline ? [stageCol] : [roleCol]),
      {
        id: 'skills',
        accessorFn: row => (row.parsedData?.skills ?? []).join(' '),
        header: () => <ColHeader>Skills</ColHeader>,
        cell: ({ row }) => <SkillsCell candidate={row.original} />,
      },
      {
        id: 'aiScore',
        accessorFn: (row: Candidate) =>
          row.aiScore?.score ?? row.aiValidation?.score ?? -1,
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            <SparklesIcon className="size-3" />
            AI Score <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => <AiScoreCell candidate={row.original} />,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className={SORT_BTN_CLS}
            onClick={() => column.toggleSorting()}
          >
            Applied <ArrowUpDownIcon className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        // Icon only, but LEFT-aligned to match the trigger button in the cell
        // below. The previous centred glyph sat roughly 16px to the right of
        // the button, so the header and its column did not read as one unit.
        header: () => (
          <ColHeader icon={<EllipsisIcon className="size-3.5" />} />
        ),
        cell: ({ row }) => (
          <div onClick={e => e.stopPropagation()}>
            {isPipeline ? (
              <PipelineActionsMenu
                candidate={row.original}
                allApps={allApps}
                allJobs={allJobs}
              />
            ) : (
              <ReviewActionsDropdown
                candidate={row.original}
                allJobs={allJobs}
                allApps={allApps}
              />
            )}
          </div>
        ),
      },
    ];
  }, [
    activeTab,
    jobInfosByCandidateId,
    stageInfoByCandidateId,
    allApps,
    allJobs,
    allClients,
    selectedIds,
    selectedCount,
    allFilteredSelected,
    toggleSelect,
    toggleSelectAll,
    setOpenStageRowId,
  ]);

  return columns;
}
