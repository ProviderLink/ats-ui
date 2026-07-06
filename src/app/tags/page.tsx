import { TagsTable } from './_components/tags-table';

export default function TagsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
      <TagsTable />
    </div>
  );
}
