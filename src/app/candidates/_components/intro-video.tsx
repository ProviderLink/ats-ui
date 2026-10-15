import { Button } from '@/components/ui/button';
import { safeHttpUrl } from '@/lib/utils';
import { ExternalLinkIcon, PlayIcon, VideoIcon } from 'lucide-react';

export function IntroVideo({
  url,
  source,
}: {
  url: string;
  source?: 'cloudinary' | 'external' | null;
}) {
  const isCloudinary = source === 'cloudinary' || url.includes('cloudinary');
  return (
    <div className="flex flex-col gap-2 h-96">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <VideoIcon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Intro Video</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          asChild
        >
          <a href={safeHttpUrl(url)} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="size-3.5" />
            Open in new tab
          </a>
        </Button>
      </div>
      {isCloudinary ? (
        <div className="flex-1 rounded-lg border bg-black overflow-hidden">
          <video src={url} controls className="size-full" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 p-4 text-center">
          <PlayIcon className="size-8 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            External video link — please open the link below to watch the
            candidate&apos;s intro video.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={safeHttpUrl(url)} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open video
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
