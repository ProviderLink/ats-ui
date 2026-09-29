import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { deleteJson, getJson, patchJson, postJson } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import {
  ChevronRightIcon,
  GripVerticalIcon,
  ListFilterIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Full reason list from admin endpoint ──────────────────────────────────────

function useDispositionReasonsAdmin() {
  const [reasons, setReasons] = useState<DispositionReason[]>([]);
  const [loading, setLoading] = useState(false);
  const didFetch = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJson<DispositionReason[]>(
        '/ats/disposition-reasons'
      );
      setReasons(data);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load reasons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  return { reasons, loading, refetch: fetchAll };
}

// ─── Category badge colour ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<DispositionReasonCategory, string> = {
  experience_and_qualifications:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  interview_performance:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  availability_and_employment:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  recruiter_or_client_selection:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  candidate_actions:
    'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  permanently_ineligible_reasons:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

// ─── Edit sheet ───────────────────────────────────────────────────────────────

function DispositionReasonSheet({
  open,
  reason,
  sheetKey,
  onClose,
  onSaved,
}: {
  open: boolean;
  reason?: DispositionReason | null;
  sheetKey: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!reason;
  const [label, setLabel] = useState(reason?.label ?? '');
  const [category, setCategory] = useState<DispositionReasonCategory>(
    reason?.category ?? 'experience_and_qualifications'
  );
  const [isActive, setIsActive] = useState(reason?.isActive ?? true);
  const [applicableStages, setApplicableStages] = useState(
    reason?.applicableStages?.join(', ') ?? ''
  );
  const [requireInternalNotes, setRequireInternalNotes] = useState(
    reason?.requireInternalNotes ?? false
  );
  const [advancedOpen, setAdvancedOpen] = useState(
    // Only opened up-front when this reason actually uses the advanced options,
    // so the common case stays a two-field form.
    (reason?.applicableStages?.length ?? 0) > 0 ||
      (reason?.requireInternalNotes ?? false)
  );
  const [saving, setSaving] = useState(false);

  /**
   * Eligibility is decided by the category, not by the user: every reason
   * outside `permanently_ineligible_reasons` is eligible to reapply. The
   * backend derives the same value on save, so this is sent explicitly only to
   * keep an edit that moves a reason OUT of the ineligible category from
   * leaving the old value behind.
   */
  const isIneligibleCategory = category === 'permanently_ineligible_reasons';

  async function handleSave() {
    if (!label.trim()) {
      toast.error('Label is required');
      return;
    }
    setSaving(true);
    try {
      const stagesArray = applicableStages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const payload = {
        label: label.trim(),
        category,
        isActive,
        applicableStages: stagesArray,
        defaultEligibility: isIneligibleCategory
          ? ('permanently_ineligible' as const)
          : ('eligible' as const),
        requireInternalNotes,
      };
      if (isEdit) {
        await patchJson(`/ats/disposition-reasons/${reason!._id}`, payload);
        toast.success('Rejection reason updated');
      } else {
        await postJson('/ats/disposition-reasons', payload);
        toast.success('Rejection reason created');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      {/* Header, scrolling body and footer each own their padding, so fields
          never sit flush against the sheet edges. Matches the sibling settings
          sheets (email/pipeline templates). */}
      {/* A fixed width, not content-driven. `SheetContent` on the right is
          `fixed` with `right-4` and no width, so it shrink-wraps its content —
          opening the Advanced disclosure would otherwise widen the sheet
          leftward. `max-w-[calc(100vw-2rem)]` keeps it on-screen at narrow
          viewports, matching the 1rem right margin. */}
      <SheetContent
        key={`sheet-${sheetKey}`}
        className="w-md max-w-[calc(100vw-2rem)] flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {isEdit ? 'Edit Rejection Reason' : 'New Rejection Reason'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the reason that recruiters can select when rejecting a candidate.'
              : 'Add a new reason for rejecting a candidate.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col gap-2">
            <Label>Label *</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Insufficient experience"
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={v => setCategory(v as DispositionReasonCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(CATEGORY_LABELS) as DispositionReasonCategory[]
                ).map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isIneligibleCategory && (
              <p className="text-xs text-muted-foreground">
                Rejecting with this reason makes the candidate permanently
                ineligible — they cannot reapply.
              </p>
            )}
          </div>

          {/* Only meaningful on an existing reason — a new one is always active. */}
          {isEdit && (
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive reasons won&apos;t appear in the reject dialog. Turn
                  this off instead of deleting to keep past rejections readable.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Active"
                className="shrink-0"
              />
            </div>
          )}

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRightIcon
                  className={cn(
                    'size-3.5 transition-transform',
                    advancedOpen && 'rotate-90'
                  )}
                />
                Advanced
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-col gap-5 pt-5">
                <div className="flex flex-col gap-2">
                  <Label>Applicable stages</Label>
                  <Input
                    value={applicableStages}
                    onChange={e => setApplicableStages(e.target.value)}
                    placeholder="e.g. Shortlisted, Interview"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stage names must match your pipeline exactly. Leave empty to
                    offer this reason at every stage.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      Require internal notes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recruiters must add notes when choosing this reason
                    </p>
                  </div>
                  <Switch
                    checked={requireInternalNotes}
                    onCheckedChange={setRequireInternalNotes}
                    aria-label="Require internal notes"
                    className="shrink-0"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <SheetFooter className="flex-row items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Rejection reasons manager ────────────────────────────────────────────────

/**
 * The rejection-reason manager itself. Exported as a standalone component so it
 * can be mounted as a tab on the settings page — the edit sheet belongs to
 * whichever component renders this, so it must not be split across a page
 * wrapper.
 */
export function DispositionReasonsCard() {
  const { reasons, loading, refetch } = useDispositionReasonsAdmin();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editSheetKey, setEditSheetKey] = useState(0);
  const [editing, setEditing] = useState<DispositionReason | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DispositionReason | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();

  /**
   * Filter, then group. Matching also covers the category name, so typing
   * "interview" surfaces that whole group rather than only the reasons whose
   * label happens to contain the word.
   */
  const grouped = (() => {
    const matches = query
      ? reasons.filter(
          r =>
            r.label.toLowerCase().includes(query) ||
            CATEGORY_LABELS[r.category].toLowerCase().includes(query)
        )
      : reasons;

    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of matches) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  })();

  const matchCount = Array.from(grouped.values()).reduce(
    (n, list) => n + list.length,
    0
  );

  function handleNew() {
    setEditing(null);
    setEditSheetKey(k => k + 1);
    setSheetOpen(true);
  }

  function handleEdit(r: DispositionReason) {
    setEditing(r);
    setEditSheetKey(k => k + 1);
    setSheetOpen(true);
  }

  /**
   * Delete an unused reason. The backend refuses (409) when the reason has been
   * used on any application or ineligible candidate, so the thrown message is
   * surfaced verbatim — it tells the admin to deactivate instead.
   */
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJson(`/ats/disposition-reasons/${deleteTarget._id}`);
      toast.success('Rejection reason deleted');
      setDeleteTarget(null);
      refetch();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete reason');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilterIcon className="size-4 text-muted-foreground" />
            Rejection Reasons
          </CardTitle>
          <CardDescription>
            Manage reasons recruiters can select when disposing candidates from
            the pipeline
          </CardDescription>
          <div className="mt-1 flex items-center gap-2">
            <div className="relative w-full max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reasons…"
                aria-label="Search rejection reasons"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="ml-auto h-8 gap-1 text-xs"
              onClick={handleNew}
            >
              <PlusIcon className="size-3.5" />
              New reason
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading && reasons.length === 0 ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <div className="flex flex-col">
              {Array.from(grouped.entries()).map(([cat, items]) => (
                <div key={cat} className="border-b last:border-b-0">
                  <div className="flex items-center gap-2 px-6 py-2 bg-muted/50">
                    <Badge variant="secondary" className={CATEGORY_COLORS[cat]}>
                      {CATEGORY_LABELS[cat]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {items.length} reason{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {items
                    .sort((a, b) => a.order - b.order)
                    .map(r => (
                      <div
                        key={r._id}
                        className="flex items-center gap-3 px-6 py-3 border-t border-muted hover:bg-muted/30 transition-colors"
                      >
                        <GripVerticalIcon className="size-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${!r.isActive ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {r.label}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {!r.isActive && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1"
                              >
                                Inactive
                              </Badge>
                            )}
                            {r.requireInternalNotes && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1"
                              >
                                Notes required
                              </Badge>
                            )}
                            {r.applicableStages.length > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 px-1"
                              >
                                {r.applicableStages.length} stage
                                {r.applicableStages.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {r.applicableStages.length === 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                All stages
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon-sm"
                                  variant="secondary"
                                  aria-label={`Edit ${r.label}`}
                                  onClick={() => handleEdit(r)}
                                >
                                  <PencilIcon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Edit reason
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {/* `destructive` is a soft danger tint —
                                    `bg-destructive/10 text-destructive` — so
                                    the irreversible action reads as risky
                                    while keeping a light background. */}
                                <Button
                                  size="icon-sm"
                                  variant="destructive"
                                  disabled={deleting}
                                  aria-label={`Delete ${r.label}`}
                                  onClick={() => setDeleteTarget(r)}
                                >
                                  <Trash2Icon className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Delete reason
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
              {matchCount === 0 && reasons.length > 0 && (
                <div className="px-6 py-8 text-sm text-muted-foreground text-center">
                  No reasons match &ldquo;{search}&rdquo;.
                </div>
              )}
              {reasons.length === 0 && !loading && (
                <div className="px-6 py-8 text-sm text-muted-foreground text-center">
                  No rejection reasons configured.{' '}
                  <button
                    className="underline hover:text-foreground"
                    onClick={handleNew}
                  >
                    Add one
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DispositionReasonSheet
        open={sheetOpen}
        reason={editing}
        sheetKey={editSheetKey}
        onClose={() => setSheetOpen(false)}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete rejection reason?"
        description={
          <>
            <span className="font-medium">{deleteTarget?.label}</span> will be
            removed permanently. This cannot be undone.
            <span className="mt-2 block text-muted-foreground">
              A reason that has already been used cannot be deleted — turn off
              <span className="font-medium"> Active </span>
              in its settings instead, which hides it from the reject dialog and
              keeps past rejections readable.
            </span>
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        confirmDisabled={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}

/** Standalone route (`/ats/settings/disposition-reasons`). */
export default function DispositionReasonsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-base font-semibold">Rejection Reasons</h1>
        <p className="text-sm text-muted-foreground">
          Manage the reasons recruiters can select when rejecting a candidate
        </p>
      </div>
      <DispositionReasonsCard />
    </div>
  );
}
