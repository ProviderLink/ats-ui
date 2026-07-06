import { useParams } from 'react-router-dom';

export default function CandidateDetailPage() {
  const { id } = useParams();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Candidate #{id}</h1>
    </div>
  );
}
