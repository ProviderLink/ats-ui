import { Suspense } from 'react';
import { TalentPoolTable } from './_components/talent-pool-table';

function TalentPoolPageContent() {
  // Candidate fetching is handled server-side inside TalentPoolTable.
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <TalentPoolTable />
    </div>
  );
}

export default function TalentPoolPage() {
  return (
    <Suspense>
      <TalentPoolPageContent />
    </Suspense>
  );
}
