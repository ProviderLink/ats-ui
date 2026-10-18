import { DispositionReasonsCard } from './_components/disposition-reasons-card';

/** Standalone route (`/ats/settings/disposition-reasons`). */
export default function DispositionReasonsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">Rejection Reasons</h1>
        <p className="text-sm text-muted-foreground">
          Manage the reasons recruiters can select when rejecting a candidate
        </p>
      </div>
      <DispositionReasonsCard />
    </div>
  );
}
