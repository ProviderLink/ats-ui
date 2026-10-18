import { Loader2Icon } from 'lucide-react';

interface ParsingScreenProps {
  message: string;
  description: string;
}

export function ParsingScreen({ message, description }: ParsingScreenProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
          <Loader2Icon className="size-8 animate-spin text-careers-accent" />
        </div>
        <div>
          <p className="text-base font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
