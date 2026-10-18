import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { logOptimisticActivity } from '@/lib/activity';
import { useClientStore } from '@/store';
import type { ClientContact } from '@/store/types';
import {
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { sanitizeDraft, type ContactDraft } from './contact-draft';
import { ContactForm } from './contact-form';
import { nameInitials } from './config';

export function ContactsTab({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: ClientContact[];
}) {
  const addContact = useClientStore(s => s.addContact);
  const updateContact = useClientStore(s => s.updateContact);
  const removeContact = useClientStore(s => s.removeContact);
  const mutating = useClientStore(s => s.mutating);

  const sorted = [...contacts].sort(
    (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [composeFor, setComposeFor] = useState<ClientContact | null>(null);

  async function handleSaveEdit(id: string, draft: ContactDraft) {
    try {
      const wasPrimary = contacts.find(c => c._id === id)?.isPrimary ?? false;
      await updateContact(clientId, id, sanitizeDraft(draft));

      // Enforce "always one primary" rule: if unchecking primary on a contact
      // that was primary, promote the next contact to primary automatically.
      if (wasPrimary && !draft.isPrimary) {
        const other = contacts.find(c => c._id !== id);
        if (other) {
          await updateContact(clientId, other._id, {
            name: other.name,
            email: other.email,
            phone: other.phone,
            position: other.position,
            isPrimary: true,
          });
          toast.success(`Primary reassigned to ${other.name}`);
        }
      }

      logOptimisticActivity(
        'client',
        clientId,
        'contact_updated',
        `Updated contact ${draft.name}`
      );
      toast.success('Contact updated');
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string, isPrimary: boolean) {
    if (contacts.length <= 1) {
      toast.error(
        'Cannot delete the only contact. A client must have at least one contact.'
      );
      setDeleteConfirmId(null);
      return;
    }
    if (isPrimary) {
      toast.error(
        'Cannot delete the primary contact. Set another contact as primary first.'
      );
      setDeleteConfirmId(null);
      return;
    }
    try {
      await removeContact(clientId, id);
      logOptimisticActivity(
        'client',
        clientId,
        'contact_removed',
        'Removed a contact'
      );
      toast.success('Contact removed');
      setDeleteConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleAdd(draft: ContactDraft) {
    try {
      await addContact(clientId, sanitizeDraft(draft));
      logOptimisticActivity(
        'client',
        clientId,
        'contact_added',
        `Added contact ${draft.name}`
      );
      toast.success('Contact added');
      setShowAdd(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </p>
        {!showAdd && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => {
              setEditingId(null);
              setShowAdd(true);
            }}
          >
            <PlusIcon className="size-3" />
            Add Contact
          </Button>
        )}
      </div>

      {contacts.length === 0 && !showAdd && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No contacts added yet.
        </div>
      )}

      {sorted.map(c =>
        editingId === c._id ? (
          <ContactForm
            key={c._id}
            initial={{
              name: c.name,
              email: c.email,
              phone: c.phone ?? '',
              position: c.position ?? '',
              isPrimary: c.isPrimary,
            }}
            saving={mutating}
            onSave={d => handleSaveEdit(c._id, d)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={c._id}
            className="rounded-lg border bg-card p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0 text-muted-foreground">
                  {nameInitials(c.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">
                    {c.name}
                  </p>
                  {c.position && (
                    <p className="text-xs text-muted-foreground truncate">
                      {c.position}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.isPrimary && (
                  <Badge
                    variant="outline"
                    className="text-xs h-6 px-2 border-pine-teal-600/50 text-pine-teal-700 dark:border-pine-teal-400/50 dark:text-pine-teal-300"
                  >
                    Primary
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setComposeFor(c)}
                  aria-label={`Email ${c.name}`}
                >
                  <MailIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setShowAdd(false);
                    setEditingId(c._id);
                  }}
                  aria-label={`Edit contact ${c.name}`}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={mutating}
                  onClick={() => setDeleteConfirmId(c._id)}
                  aria-label={`Delete contact ${c.name}`}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MailIcon className="size-4 shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
              {c.phone && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhoneIcon className="size-4 shrink-0" />
                  {c.phone}
                </span>
              )}
            </div>
            {deleteConfirmId === c._id && <Separator />}
            {deleteConfirmId === c._id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Delete this contact?
                </span>
                <Button
                  variant="destructive"
                  size="xs"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={mutating}
                  onClick={() => handleDelete(c._id, c.isPrimary)}
                >
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  No
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {showAdd && (
        <ContactForm
          saving={mutating}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <ComposeEmailSheet
        open={!!composeFor}
        onOpenChange={v => !v && setComposeFor(null)}
        mode={
          composeFor
            ? {
                type: 'prefill',
                to: composeFor.email,
                subject: '',
                body: '',
                templateType: 'general',
                context: { type: 'general' },
                variables: {
                  candidateName: composeFor.name,
                  candidateEmail: composeFor.email,
                  candidatePhone: composeFor.phone ?? '',
                  jobTitle: '',
                  clientName: '',
                  currentStage: '',
                  companyName: '',
                  senderName: '',
                },
              }
            : { type: 'new' }
        }
      />
    </div>
  );
}
