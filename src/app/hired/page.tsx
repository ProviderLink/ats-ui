import { Suspense } from 'react';
import { HiredTable } from './_components/hired-table';

function HiredPageContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <HiredTable />
    </div>
  );
}

export default function HiredPage() {
  return (
    <Suspense>
      <HiredPageContent />
    </Suspense>
  );
}
