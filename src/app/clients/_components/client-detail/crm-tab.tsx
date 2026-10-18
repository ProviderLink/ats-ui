import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { logOptimisticActivity } from '@/lib/activity';
import { cn } from '@/lib/utils';
import { useClientStore } from '@/store';
import type { ClientCrmProfile } from '@/store/types';
import {
  BuildingIcon,
  CalendarIcon,
  PencilIcon,
  StarIcon,
  XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDate, healthConfig } from './config';
import {
  BoolIndicator,
  Dash,
  InfoRow,
  SectionTitle,
  StarRating,
} from './primitives';
import { CrmEditForm } from './crm-edit-form';

export function CrmTab({
  clientId,
  crm: initialCrm,
}: {
  clientId: string;
  crm: ClientCrmProfile;
}) {
  const updateCrmProfile = useClientStore(s => s.updateCrmProfile);
  const mutating = useClientStore(s => s.mutating);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClientCrmProfile>(initialCrm);

  async function handleSave() {
    try {
      await updateCrmProfile(clientId, draft);
      logOptimisticActivity(
        'client',
        clientId,
        'crm_profile_updated',
        'Updated CRM profile'
      );
      toast.success('CRM profile updated');
      setEditing(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (editing) {
    return (
      <CrmEditForm
        draft={draft}
        onChange={setDraft}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        saving={mutating}
      />
    );
  }

  const health = initialCrm.healthStatus
    ? healthConfig[initialCrm.healthStatus]
    : null;

  return (
    <div className="flex flex-col gap-6 py-5">
      <div className="flex items-center justify-between">
        <SectionTitle>Health &amp; Satisfaction</SectionTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => {
            setDraft(initialCrm);
            setEditing(true);
          }}
        >
          <PencilIcon className="size-3" />
          Edit
        </Button>
      </div>

      {health && (
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full shrink-0', health.dot)} />
          <span className={cn('text-sm font-medium', health.cls)}>
            {health.label}
          </span>
        </div>
      )}

      <InfoRow
        icon={<StarIcon className="size-4" />}
        label="Satisfaction Score"
      >
        <StarRating score={initialCrm.satisfactionScore} />
      </InfoRow>
      <InfoRow icon={<XCircleIcon className="size-4" />} label="Open Issues">
        <span
          className={cn(
            'font-medium',
            (initialCrm.openIssuesCount ?? 0) > 0
              ? 'text-rose-600 dark:text-rose-400'
              : ''
          )}
        >
          {initialCrm.openIssuesCount ?? 0}
        </span>
      </InfoRow>
      <InfoRow icon={<CalendarIcon className="size-4" />} label="Last Check-in">
        {initialCrm.lastClientCheckin ? (
          formatDate(initialCrm.lastClientCheckin)
        ) : (
          <Dash />
        )}
      </InfoRow>

      <Separator />

      <div className="flex flex-col gap-4">
        <SectionTitle>Onboarding</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Onboarding</span>
            <BoolIndicator
              value={!!initialCrm.onboardingComplete}
              trueLabel="Complete"
              falseLabel="Pending"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">SOP Received</span>
            <BoolIndicator
              value={!!initialCrm.sopReceived}
              trueLabel="Received"
              falseLabel="Pending"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">BAA Signed</span>
            <BoolIndicator
              value={!!initialCrm.baaSign}
              trueLabel="Signed"
              falseLabel="Not signed"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">BAA Date</span>
            <span className="text-sm">
              {initialCrm.baaSignedDate ? (
                formatDate(initialCrm.baaSignedDate)
              ) : (
                <Dash />
              )}
            </span>
          </div>
        </div>
        {initialCrm.emrSystem && (
          <InfoRow
            icon={<BuildingIcon className="size-4" />}
            label="EMR System"
          >
            {initialCrm.emrSystem}
          </InfoRow>
        )}
      </div>

      {initialCrm.notes && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <SectionTitle>Notes</SectionTitle>
            <p className="text-sm leading-relaxed text-foreground/80">
              {initialCrm.notes}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
