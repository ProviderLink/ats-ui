import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { getJson, patchJson, postJson } from '@/lib/api-client';
import {
  CATEGORY_LABELS,
  type DispositionReason,
  type DispositionReasonCategory,
} from '@/store/slices/disposition-reasons.store';
import {
  GripVerticalIcon,
  ListFilterIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
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
  const [defaultEligibility, setDefaultEligibility] = useState<
    'eligible' | 'permanently_ineligible'
  >(reason?.defaultEligibility ?? 'eligible');
  const [requireInternalNotes, setRequireInternalNotes] = useState(
    reason?.requireInternalNotes ?? false
  );
  const [saving, setSaving] = useState(false);

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
        defaultEligibility:
          category === 'permanently_ineligible_reasons'
            ? 'permanently_ineligible'
            : defaultEligibility,
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
      <SheetContent
        key={`sheet-${sheetKey}`}
        className="sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? 'Edit Rejection Reason' : 'New Rejection Reason'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the reason that recruiters can select when rejecting a candidate.'
              : 'Add a new reason for rejecting a candidate.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
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
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive reasons won&apos;t appear in the reject dialog
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Active"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Applicable Stages</Label>
            <Input
              value={applicableStages}
              onChange={e => setApplicableStages(e.target.value)}
              placeholder="Comma-separated stage names (empty = all stages)"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to apply to all pipeline stages. Separate stage names
              with commas.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Default Eligibility</Label>
            <Select
              value={defaultEligibility}
              onValueChange={v =>
                setDefaultEligibility(
                  v as 'eligible' | 'permanently_ineligible'
                )
              }
              disabled={category === 'permanently_ineligible_reasons'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eligible">Eligible to Reapply</SelectItem>
                <SelectItem value="permanently_ineligible">
                  Permanently Ineligible
                </SelectItem>
              </SelectContent>
            </Select>
            {category === 'permanently_ineligible_reasons' && (
              <p className="text-xs text-muted-foreground">
                Locked to Permanently Ineligible for this category
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Require Internal Notes</p>
              <p className="text-xs text-muted-foreground">
                Recruiters must provide notes when selecting this reason
              </p>
            </div>
            <Switch
              checked={requireInternalNotes}
              onCheckedChange={setRequireInternalNotes}
              aria-label="Require internal notes"
            />
          </div>
        </div>
        <SheetFooter>
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

// ─── Page component ───────────────────────────────────────────────────────────

export default function DispositionReasonsPage() {
  const { reasons, loading, refetch } = useDispositionReasonsAdmin();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editSheetKey, setEditSheetKey] = useState(0);
  const [editing, setEditing] = useState<DispositionReason | null>(null);

  // Group by category
  const grouped = (() => {
    const map = new Map<DispositionReasonCategory, DispositionReason[]>();
    for (const r of reasons) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  })();

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

  async function handleToggleActive(id: string, current: boolean) {
    try {
      if (current) {
        await patchJson(`/ats/disposition-reasons/${id}/deactivate`, {});
        toast.success('Reason deactivated');
      } else {
        await patchJson(`/ats/disposition-reasons/${id}`, {
          isActive: true,
        });
        toast.success('Reason activated');
      }
      refetch();
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update');
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
          <div className="flex justify-end mt-1">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleNew}>
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
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Edit"
                            onClick={() => handleEdit(r)}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={r.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() =>
                              handleToggleActive(r._id, r.isActive)
                            }
                          >
                            {r.isActive ? (
                              <PowerOffIcon className="size-3.5" />
                            ) : (
                              <PowerIcon className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
              {reasons.length === 0 && !loading && (
                <div className="px-6 py-8 text-sm text-muted-foreground text-center">
                  No rejections reasons configured.{' '}
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
    </>
  );
}
