import { PermanentlyIneligibleTable } from './_components/permanently-ineligible-table';

export default function PermanentlyIneligiblePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <PermanentlyIneligibleTable />
    </div>
  );
}
