import { Loader2Icon } from 'lucide-react';

interface LoadingScreenProps {
  message: string;
  description: string;
}

export function LoadingScreen({ message, description }: LoadingScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
        <div>
          <p className="text-base font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
