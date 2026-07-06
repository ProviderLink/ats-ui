import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2Icon } from 'lucide-react';
import * as React from 'react';

type Variant = 'default' | 'destructive' | 'success';

const confirmBtnVariant: Record<
  Variant,
  React.ComponentProps<typeof Button>['variant']
> = {
  default: 'default',
  destructive: 'destructive',
  success: 'default',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Reusable confirmation dialog for irreversible actions.
 * The body fires `onConfirm` and waits for any returned promise; while pending
 * the confirm button is disabled and shows a spinner.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  confirmDisabled = false,
  onConfirm,
}: Props) {
  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <div className="py-2">{children}</div>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmBtnVariant[variant]}
            className={
              variant === 'success'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                : undefined
            }
            onClick={handleConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
