import { ComposeEmailSheet } from '@/app/emails/_components/compose-email-sheet';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import type { ClientContact } from '@/store/types';
import { PlusIcon } from 'lucide-react';
import { ContactCard } from './contact-card';
import { buildContactComposeMode } from './contact-compose';
import { ContactForm } from './contact-form';
import { useClientContacts } from './use-client-contacts';

interface ContactsTabProps {
  clientId: string;
  contacts: ClientContact[];
}

export function ContactsTab({ clientId, contacts }: ContactsTabProps) {
  const state = useClientContacts(clientId, contacts);

  return (
    <div className="flex flex-col gap-3 py-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </p>
        {!state.showAdd && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={state.startAdd}
          >
            <PlusIcon className="size-3" />
            Add Contact
          </Button>
        )}
      </div>

      {contacts.length === 0 && !state.showAdd && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No contacts added yet.
        </div>
      )}

      {state.sorted.map(c =>
        state.editingId === c._id ? (
          <ContactForm
            key={c._id}
            initial={{
              name: c.name,
              email: c.email,
              phone: c.phone ?? '',
              position: c.position ?? '',
              isPrimary: c.isPrimary,
            }}
            saving={state.mutating}
            onSave={d => state.saveEdit(c._id, d)}
            onCancel={state.cancelEdit}
          />
        ) : (
          <ContactCard
            key={c._id}
            contact={c}
            mutating={state.mutating}
            onEmail={() => state.openCompose(c)}
            onEdit={() => state.startEdit(c._id)}
            onDelete={() => state.askDelete(c)}
          />
        )
      )}

      {state.showAdd && (
        <ContactForm
          saving={state.mutating}
          onSave={state.add}
          onCancel={state.cancelAdd}
        />
      )}

      <ConfirmDialog
        open={!!state.deleteTarget}
        onOpenChange={open => !open && state.cancelDelete()}
        title="Delete contact?"
        description={
          state.deleteTarget && (
            <>
              <strong>{state.deleteTarget.name}</strong> will be removed from
              this client. This action cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={state.mutating}
        onConfirm={() =>
          state.deleteTarget
            ? state.remove(state.deleteTarget._id, state.deleteTarget.isPrimary)
            : undefined
        }
      />

      <ComposeEmailSheet
        open={!!state.composeFor}
        onOpenChange={v => !v && state.closeCompose()}
        mode={buildContactComposeMode(state.composeFor)}
      />
    </div>
  );
}
