import { TalentPoolTable } from './_components/talent-pool-table';

export default function TalentPoolPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <TalentPoolTable />
    </div>
  );
}
