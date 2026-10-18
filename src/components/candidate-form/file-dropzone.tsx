import { cn } from '@/lib/utils';
import { FileTextIcon, UploadIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  allowedTypes: string[];
  invalidMessage: string;
  prompt: string;
  hint: string;
  compact?: boolean;
}

export function FileDropzone({
  file,
  onFileChange,
  accept,
  allowedTypes,
  invalidMessage,
  prompt,
  hint,
  compact,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function select(selected: File | undefined) {
    if (!selected) return;
    if (allowedTypes.includes(selected.type)) onFileChange(selected);
    else toast.error(invalidMessage);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input px-4 text-center transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          compact ? 'min-h-24 gap-2 py-6' : 'min-h-32 gap-3 py-8',
          dragOver && 'border-foreground bg-muted/40'
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          select(e.dataTransfer.files[0]);
        }}
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileTextIcon className="size-4 text-muted-foreground" />
            <span>{file.name}</span>
            <button
              type="button"
              className="ml-1 rounded-full p-0.5 hover:bg-muted"
              onClick={e => {
                e.stopPropagation();
                onFileChange(null);
              }}
            >
              <XIcon className="size-3 text-foreground/50" />
            </button>
          </div>
        ) : (
          <>
            <UploadIcon
              className={cn(
                'text-muted-foreground',
                compact ? 'size-6' : 'size-7'
              )}
            />
            <div>
              <p className="text-sm font-medium text-foreground">{prompt}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={e => {
          select(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}
