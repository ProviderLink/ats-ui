import { ConfirmDialog } from '@/components/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReactNode } from 'react';

export type ApproveVariant = 'approve' | 'email' | 'emailPool';

interface VariantCopy {
  title: { pending: string; application: string };
  confirmLabel: string;
  /** Text after the job title when the candidate applied to a job. */
  withJob: string;
  /** Text after "Select a job to assign <name> to". */
  withoutJob: string;
  /** Text after "Approve <name>" for an application awaiting approval. */
  application: string;
}

const COMPOSER = 'open the email composer with the approval template';

const VARIANT_COPY: Record<ApproveVariant, VariantCopy> = {
  approve: {
    title: { pending: 'Approve candidate', application: 'Approve application' },
    confirmLabel: 'Approve',
    withJob: '? This creates their application in the pipeline.',
    withoutJob:
      '. This approves the candidate and creates their application in the pipeline.',
    application:
      ' for the pending application? This moves the candidate into the pipeline.',
  },
  email: {
    title: {
      pending: 'Approve candidate & email',
      application: 'Approve & email',
    },
    confirmLabel: 'Approve & open composer',
    withJob: ` and ${COMPOSER}.`,
    withoutJob: `, then ${COMPOSER}.`,
    application: ` and ${COMPOSER}? You will be able to review the email before sending.`,
  },
  emailPool: {
    title: {
      pending: 'Approve candidate, email & talent pool',
      application: 'Approve, email & add to talent pool',
    },
    confirmLabel: 'Approve & open composer',
    withJob: `, add them to the talent pool, and ${COMPOSER}.`,
    withoutJob: `, add them to the talent pool, and ${COMPOSER}.`,
    application: `, add them to the talent pool, and ${COMPOSER}?`,
  },
};

interface ApproveCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ApproveVariant;
  /** True while the candidate is In Review, i.e. has no application yet. */
  isPending: boolean;
  candidateName: string;
  appliedJobId?: string | null;
  appliedJobTitle: string | null;
  openJobs: { _id: string; title: string }[];
  selectedJobId: string;
  onSelectedJobIdChange: (id: string) => void;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
}

function Name({ children }: { children: ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

export function ApproveCandidateDialog({
  open,
  onOpenChange,
  variant,
  isPending,
  candidateName,
  appliedJobId,
  appliedJobTitle,
  openJobs,
  selectedJobId,
  onSelectedJobIdChange,
  loading,
  onConfirm,
}: ApproveCandidateDialogProps) {
  const copy = VARIANT_COPY[variant];

  let description: ReactNode;
  if (!isPending) {
    description = (
      <>
        Approve <Name>{candidateName}</Name>
        {copy.application}
      </>
    );
  } else if (appliedJobId) {
    description = (
      <>
        Approve <Name>{candidateName}</Name> for <Name>{appliedJobTitle}</Name>
        {copy.withJob}
      </>
    );
  } else {
    description = (
      <>
        Select a job to assign <Name>{candidateName}</Name> to{copy.withoutJob}
      </>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="success"
      title={isPending ? copy.title.pending : copy.title.application}
      description={description}
      confirmLabel={copy.confirmLabel}
      loading={loading}
      confirmDisabled={isPending && !selectedJobId}
      onConfirm={onConfirm}
    >
      {isPending && (
        <div className="space-y-1.5">
          <Label className="text-sm">Assign to job</Label>
          {appliedJobId ? (
            <p className="text-sm font-medium">{appliedJobTitle}</p>
          ) : (
            <Select value={selectedJobId} onValueChange={onSelectedJobIdChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a job…" />
              </SelectTrigger>
              <SelectContent>
                {openJobs.map(j => (
                  <SelectItem key={j._id} value={j._id}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}
