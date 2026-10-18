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
import { Input } from '@/components/ui/input';
import { deleteJson } from '@/lib/api-client';
import {
  CATEGORY_LABELS,
  type DispositionReason,
} from '@/store/slices/disposition-reasons.store';
import { ListFilterIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDispositionReasonsAdmin } from '../_hooks/use-disposition-reasons-admin';
import { CATEGORY_COLORS, groupReasons } from '../_utils/reason-groups';
import { DispositionReasonSheet } from './disposition-reason-sheet';
import { ReasonRow } from './reason-row';

/**
 * The rejection-reason manager, mounted as a tab on the general settings page
 * and on its own route. The edit sheet belongs to whichever component renders
 * this, so it must not be split across a page wrapper.
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

  const grouped = groupReasons(reasons, search);
  const matchCount = Array.from(grouped.values()).reduce(
    (n, list) => n + list.length,
    0
  );

  function openSheet(reason: DispositionReason | null) {
    setEditing(reason);
    setEditSheetKey(k => k + 1);
    setSheetOpen(true);
  }

  /**
   * Delete an unused reason. The backend refuses (409) when the reason has
   * been used on any application or ineligible candidate; that message is
   * surfaced verbatim and tells the admin to deactivate instead.
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
              onClick={() => openSheet(null)}
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
                      <ReasonRow
                        key={r._id}
                        reason={r}
                        deleting={deleting}
                        onEdit={() => openSheet(r)}
                        onDelete={() => setDeleteTarget(r)}
                      />
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
                    onClick={() => openSheet(null)}
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
