import { Button } from '@/components/ui/button';
import { Loader2Icon, PaperclipIcon, SendIcon } from 'lucide-react';
import type { RefObject } from 'react';

interface ComposeFooterProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
  sending: boolean;
  onFiles: (files: FileList | null) => void;
  onDiscard: () => void;
  onSend: () => void;
}

export function ComposeFooter({
  fileInputRef,
  uploading,
  sending,
  onFiles,
  onDiscard,
  onSend,
}: ComposeFooterProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => onFiles(e.target.files)}
      />
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <PaperclipIcon className="size-4" />
        )}
        {uploading ? 'Uploading…' : 'Attach file'}
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onDiscard}>
          Discard
        </Button>
        <Button
          className="gap-2"
          onClick={onSend}
          disabled={sending || uploading}
        >
          <SendIcon className="size-4" />
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
