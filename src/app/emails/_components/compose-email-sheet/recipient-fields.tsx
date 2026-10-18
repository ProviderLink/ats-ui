import {
  RecipientField,
  type RecipientFieldHandle,
} from '@/components/recipient-field';
import { Label } from '@/components/ui/label';

interface RecipientFieldsProps {
  to: string;
  cc: string;
  bcc: string;
  showCc: boolean;
  showBcc: boolean;
  toRef: React.Ref<RecipientFieldHandle>;
  ccRef: React.Ref<RecipientFieldHandle>;
  bccRef: React.Ref<RecipientFieldHandle>;
  onToChange: (v: string) => void;
  onCcChange: (v: string) => void;
  onBccChange: (v: string) => void;
  onShowCopyFields: () => void;
}

export function RecipientFields({
  to,
  cc,
  bcc,
  showCc,
  showBcc,
  toRef,
  ccRef,
  bccRef,
  onToChange,
  onCcChange,
  onBccChange,
  onShowCopyFields,
}: RecipientFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="to">To</Label>
          {!showCc && !showBcc && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={onShowCopyFields}
            >
              + Cc / Bcc
            </button>
          )}
        </div>
        <RecipientField
          id="to"
          ref={toRef}
          placeholder="recipient@email.com"
          value={to}
          onChange={onToChange}
        />
      </div>

      {showCc && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cc">Cc</Label>
          <RecipientField
            id="cc"
            ref={ccRef}
            placeholder="cc@email.com"
            value={cc}
            onChange={onCcChange}
          />
        </div>
      )}

      {showBcc && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bcc">Bcc</Label>
          <RecipientField
            id="bcc"
            ref={bccRef}
            placeholder="bcc@email.com"
            value={bcc}
            onChange={onBccChange}
          />
        </div>
      )}
    </>
  );
}
