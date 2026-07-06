import { useParams } from 'react-router-dom';

export default function TeamMemberPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Team Member #{id}</h1>
    </div>
  );
}
