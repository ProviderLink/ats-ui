import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmailTemplateStore, useUserStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { MailIcon, PlusIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useEmailTemplateActions } from '../_hooks/use-email-template-actions';
import { EmailTemplateSheet } from './email-template-sheet';
import { EmailTemplateViewDialog } from './email-template-view-dialog';
import { TemplateRow } from './email-templates-card/template-row';

export function EmailTemplatesCard() {
  const templates = useEmailTemplateStore(s => s.items);
  const loading = useEmailTemplateStore(s => s.loading);
  const fetch = useEmailTemplateStore(s => s.fetch);
  const users = useUserStore(s => s.items);
  const actions = useEmailTemplateActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | undefined>(undefined);
  const [viewing, setViewing] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function resolveUserName(id?: string): string {
    if (!id) return 'System';
    const user = users.find(u => u._id === id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'System';
  }

  function openSheet(tpl?: EmailTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
  }

  const templateToDelete = deleteId
    ? templates.find(t => t._id === deleteId)
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="size-4 text-muted-foreground" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Reusable templates for automated email communications
          </CardDescription>
          <div className="flex justify-end mt-1">
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => openSheet()}
            >
              <PlusIcon className="size-3.5" />
              New template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="flex flex-col">
            {loading && templates.length === 0 && (
              <div className="flex flex-col gap-3 px-6 py-4">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-14 rounded-md bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {templates.map((tpl, i) => (
              <Fragment key={tpl._id}>
                {i > 0 && <Separator />}
                <TemplateRow
                  template={tpl}
                  createdByName={resolveUserName(tpl.createdBy)}
                  togglingActive={actions.togglingId === tpl._id}
                  settingDefault={actions.settingDefaultId === tpl._id}
                  onSetDefault={() => actions.makeDefault(tpl)}
                  onToggleActive={() => actions.toggleActive(tpl)}
                  onView={() => setViewing(tpl)}
                  onEdit={() => openSheet(tpl)}
                  onDelete={() => setDeleteId(tpl._id)}
                />
              </Fragment>
            ))}
            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <MailIcon className="size-8 opacity-30" />
                <p>No email templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openSheet()}
                  className="mt-1 gap-1"
                >
                  <PlusIcon className="size-3.5" /> Create one
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EmailTemplateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={editing}
        onSave={data => actions.save(data, editing)}
      />

      <EmailTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          openSheet(tpl);
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete email template?"
        description={
          templateToDelete ? (
            <span>
              <strong>{templateToDelete.name}</strong> will be permanently
              deleted. This action cannot be undone.
            </span>
          ) : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={actions.deleting}
        onConfirm={async () => {
          if (deleteId && (await actions.deleteTemplate(deleteId)))
            setDeleteId(null);
        }}
      />
    </>
  );
}
