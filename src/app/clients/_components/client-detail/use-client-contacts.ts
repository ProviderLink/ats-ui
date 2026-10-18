import { logOptimisticActivity } from '@/lib/activity';
import { useClientStore } from '@/store';
import type { ClientContact } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { sanitizeDraft, type ContactDraft } from './contact-draft';

export function useClientContacts(
  clientId: string,
  contacts: ClientContact[]
) {
  const addContact = useClientStore(s => s.addContact);
  const updateContact = useClientStore(s => s.updateContact);
  const removeContact = useClientStore(s => s.removeContact);
  const mutating = useClientStore(s => s.mutating);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [composeFor, setComposeFor] = useState<ClientContact | null>(null);

  // Primary contact first.
  const sorted = [...contacts].sort(
    (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
  );

  async function saveEdit(id: string, draft: ContactDraft) {
    try {
      const wasPrimary = contacts.find(c => c._id === id)?.isPrimary ?? false;
      await updateContact(clientId, id, sanitizeDraft(draft));

      // Enforce "always one primary": unchecking primary on the primary
      // contact promotes the next contact automatically.
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

  async function remove(id: string, isPrimary: boolean) {
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

  async function add(draft: ContactDraft) {
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

  return {
    sorted,
    mutating,
    editingId,
    showAdd,
    deleteConfirmId,
    composeFor,
    startAdd: () => {
      setEditingId(null);
      setShowAdd(true);
    },
    cancelAdd: () => setShowAdd(false),
    startEdit: (id: string) => {
      setShowAdd(false);
      setEditingId(id);
    },
    cancelEdit: () => setEditingId(null),
    askDelete: setDeleteConfirmId,
    cancelDelete: () => setDeleteConfirmId(null),
    openCompose: setComposeFor,
    closeCompose: () => setComposeFor(null),
    saveEdit,
    remove,
    add,
  };
}
