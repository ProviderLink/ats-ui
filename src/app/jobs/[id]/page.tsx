import { useSocketRoom } from '@/hooks/use-socket-room';
import { useParams } from 'react-router-dom';

export default function JobDetailPage() {
  const { id } = useParams();
  useSocketRoom('job', id);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Job #{id}</h1>
    </div>
  );
}
