'use client';

import { cn } from '@/lib/utils';
import { Popover as PopoverPrimitive } from 'radix-ui';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * A modal Sheet/Dialog parks a scroll lock on `document` (react-remove-scroll,
 * via Radix) that cancels every `wheel` / `touchmove` which does not start
 * inside a node it was told to allow. Popover content is portaled to <body>,
 * so it is always treated as "outside" and any scrollable list inside it — the
 * email template picker, for example — silently refuses to scroll while a
 * sheet is open.
 *
 * Stopping propagation during the capture phase keeps the event from ever
 * reaching that document-level guard. It does NOT block scrolling: the
 * browser's default action still runs against the original target.
 */
function allowInnerScroll(e: React.SyntheticEvent): void {
  e.stopPropagation();
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  onWheelCapture,
  onTouchMoveCapture,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-none',
          className
        )}
        onWheelCapture={
          onWheelCapture
            ? e => {
                onWheelCapture(e);
                allowInnerScroll(e);
              }
            : allowInnerScroll
        }
        onTouchMoveCapture={
          onTouchMoveCapture
            ? e => {
                onTouchMoveCapture(e);
                allowInnerScroll(e);
              }
            : allowInnerScroll
        }
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
