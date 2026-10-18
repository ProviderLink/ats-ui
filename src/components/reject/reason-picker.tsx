import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface ReasonPickerProps {
  reasons: DispositionReason[];
  loading: boolean;
  selectedReasonId: string;
  onSelect: (reasonId: string) => void;
}

export function ReasonPicker({
  reasons,
  loading,
  selectedReasonId,
  onSelect,
}: ReasonPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedReason = reasons.find(r => r._id === selectedReasonId) ?? null;

  /**
   * Filter, then group. The seeded list holds ~50 reasons, so a search box is
   * the only practical way to find one. Matching also covers the category name,
   * so typing "interview" surfaces that whole group rather than only the
   * reasons whose label happens to contain the word.
   */
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = q
      ? reasons.filter(
          r =>
            r.label.toLowerCase().includes(q) ||
            CATEGORY_LABELS[r.category].toLowerCase().includes(q)
        )
      : reasons;

    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of matches) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [reasons, search]);

  const matchCount = useMemo(
    () => Array.from(grouped.values()).reduce((n, list) => n + list.length, 0),
    [grouped]
  );

  return (
    <div className="space-y-2">
      <Label>Rejection Reason *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            aria-label="Rejection reason"
            className="w-full justify-between font-normal text-sm"
          >
            <span
              className={cn(
                'truncate',
                !selectedReason && 'text-muted-foreground'
              )}
            >
              {selectedReason
                ? selectedReason.label
                : loading
                  ? 'Loading reasons…'
                  : 'Select a reason…'}
            </span>
            <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={e => {
            // Radix focuses the content container first; send it to the
            // search field instead so the user can type immediately.
            e.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reasons…"
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {CATEGORY_LABELS[category]}
                </p>
                {items.map(r => {
                  const isSelected = r._id === selectedReasonId;
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => {
                        onSelect(r._id);
                        setSearch('');
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                        isSelected && 'bg-accent'
                      )}
                    >
                      <CheckIcon
                        className={cn(
                          'size-3.5 shrink-0',
                          !isSelected && 'invisible'
                        )}
                      />
                      <span className="flex-1 truncate">{r.label}</span>
                      {/* Choosing one of these bans the candidate from
                          reapplying, so flag it before it is picked. */}
                      {r.category === 'permanently_ineligible_reasons' && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-destructive/40 text-[10px] text-destructive"
                        >
                          Never rehire
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {matchCount === 0 && reasons.length > 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No reasons match &ldquo;{search}&rdquo;
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {!loading && reasons.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No rejection reasons configured. Add them under Settings → Rejection
          Reasons.
        </p>
      )}
    </div>
  );
}
