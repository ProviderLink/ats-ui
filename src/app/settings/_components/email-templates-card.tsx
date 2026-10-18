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
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import { useEmailTemplateStore, useUserStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import {
  EyeIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { EmailTemplateSheet } from './email-template-sheet';
import {
  EmailTemplateViewDialog,
} from './email-template-view-dialog';

export function EmailTemplatesCard() {
  const {
    items: templates,
    loading,
    fetch,
    create,
    update,
    setDefault,
    remove,
  } = useEmailTemplateStore();
  const users = useUserStore(s => s.items);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | undefined>(undefined);
  const [viewing, setViewing] = useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  function resolveUserName(id?: string): string {
    if (!id) return 'System';
    const user = users.find(u => u._id === id);
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'System';
  }

  function handleNew() {
    setEditing(undefined);
    setSheetOpen(true);
  }

  function handleView(tpl: EmailTemplate) {
    setViewing(tpl);
  }

  function handleEdit(tpl: EmailTemplate) {
    setEditing(tpl);
    setSheetOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      toast.success('Email template deleted');
      setDeleteId(null);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(tpl: EmailTemplate) {
    setTogglingId(tpl._id);
    try {
      await update(tpl._id, { isActive: !tpl.isActive });
      toast.success(
        tpl.isActive ? 'Template deactivated' : 'Template activated'
      );
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update template');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSetDefault(tpl: EmailTemplate) {
    setSettingDefaultId(tpl._id);
    try {
      await setDefault(tpl._id);
      toast.success(
        `"${tpl.name}" is now the default for ${EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type} emails`
      );
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default');
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleSave(
    data: Omit<
      EmailTemplate,
      | '_id'
      | 'createdBy'
      | 'updatedBy'
      | 'createdAt'
      | 'updatedAt'
      | 'variables'
    > & { variables: string[] }
  ) {
    try {
      if (editing) {
        await update(editing._id, data);
        if (data.isDefault) {
          toast.success(
            `Template updated and set as default for ${EMAIL_TEMPLATE_TYPE_LABELS[data.type] ?? data.type} emails`
          );
        } else {
          toast.success('Email template updated');
        }
      } else {
        await create(data);
        if (data.isDefault) {
          toast.success(
            `Template created and set as default for ${EMAIL_TEMPLATE_TYPE_LABELS[data.type] ?? data.type} emails`
          );
        } else {
          toast.success('Email template created');
        }
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
      throw e;
    }
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
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleNew}>
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
              <div key={tpl._id}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-3 px-6 py-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      <Badge variant="outline" className="text-xs h-4 px-1.5">
                        {EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type}
                      </Badge>
                      {tpl.isDefault && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="text-xs h-4 px-1.5 gap-0.5 cursor-default"
                            >
                              <StarIcon className="size-2.5" />
                              Default for {EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs max-w-52"
                          >
                            This template is auto-selected when sending a{' '}
                            <strong>{EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type}</strong>{' '}
                            email.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">
                      {tpl.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {resolveUserName(tpl.createdBy)} ·{' '}
                      {formatDate(tpl.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Set as default */}
                    {!tpl.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleSetDefault(tpl)}
                            disabled={settingDefaultId === tpl._id}
                          >
                            <StarIcon className="size-3" />
                            Set default
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-52">
                          Make this the default template for{' '}
                          <strong>{EMAIL_TEMPLATE_TYPE_LABELS[tpl.type] ?? tpl.type}</strong>{' '}
                          emails. The current default will be replaced.
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Active toggle */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'h-7 gap-1 px-2 text-xs',
                            tpl.isActive
                              ? 'text-muted-foreground hover:text-foreground'
                              : 'text-muted-foreground/50 hover:text-foreground'
                          )}
                          onClick={() => handleToggleActive(tpl)}
                          disabled={togglingId === tpl._id}
                        >
                          <PowerIcon className="size-3" />
                          {tpl.isActive ? 'Active' : 'Inactive'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {tpl.isActive
                          ? 'Click to deactivate'
                          : 'Click to activate'}
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleView(tpl)}
                    >
                      <EyeIcon className="size-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      onClick={() => handleEdit(tpl)}
                    >
                      <PencilIcon className="size-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                      onClick={() => setDeleteId(tpl._id)}
                    >
                      <Trash2Icon className="size-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground px-6">
                <MailIcon className="size-8 opacity-30" />
                <p>No email templates yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNew}
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
        onSave={handleSave}
      />

      <EmailTemplateViewDialog
        open={!!viewing}
        onOpenChange={open => !open && setViewing(null)}
        template={viewing}
        onEdit={tpl => {
          setViewing(null);
          handleEdit(tpl);
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
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
