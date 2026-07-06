import { Loader2Icon } from 'lucide-react';

export function AppLoader() {
  return (
    <div className="w-full flex-1 flex items-center justify-center bg-background">
      <Loader2Icon className="size-8 animate-spin text-primary" />
    </div>
  );
}
