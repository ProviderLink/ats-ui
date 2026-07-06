import { ClientsTable } from './_components/clients-table';

export default function ClientsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <ClientsTable />
    </div>
  );
}
