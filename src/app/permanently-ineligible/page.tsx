import { Suspense } from 'react';
import { PermanentlyIneligibleTable } from './_components/permanently-ineligible-table';

function PermanentlyIneligiblePageContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <PermanentlyIneligibleTable />
    </div>
  );
}

export default function PermanentlyIneligiblePage() {
  return (
    <Suspense>
      <PermanentlyIneligiblePageContent />
    </Suspense>
  );
}
