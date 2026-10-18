import { CameraIcon } from 'lucide-react';
import { useRef } from 'react';

interface LogoPickerProps {
  preview: string | null;
  initials: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
}

export function LogoPicker({
  preview,
  initials,
  onSelect,
  onRemove,
}: LogoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="relative size-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload company logo"
      >
        {preview ? (
          <img
            src={preview}
            alt="Logo preview"
            className="size-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
          <CameraIcon className="size-4 text-white" />
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Company Logo</p>
        <p className="text-xs text-muted-foreground">
          Click to upload (PNG, JPG, SVG)
        </p>
        {preview && (
          <button
            type="button"
            className="text-xs text-destructive hover:underline text-left"
            onClick={() => {
              onRemove();
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
