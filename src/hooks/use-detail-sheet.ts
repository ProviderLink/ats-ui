import { useState } from 'react';

/** The row shown in a detail sheet, and the sheet's open flag. */
export function useDetailSheet<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const [open, setOpen] = useState(false);

  return {
    selected,
    open,
    show: (item: T) => {
      setSelected(item);
      setOpen(true);
    },
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) setSelected(null);
    },
  };
}
