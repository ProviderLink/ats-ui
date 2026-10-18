import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logOptimisticActivity } from '@/lib/activity';
import { useClientStore } from '@/store';
import type { ClientNote, NoteMethod } from '@/store/types';
import { PlusIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';

const NO_NOTES: ClientNote[] = [];

export function NotesTab({ clientId }: { clientId: string }) {
  const notes = useClientStore(s => s.notes[clientId]) ?? NO_NOTES;
  const notesLoading = useClientStore(s => s.notesLoading);
  const fetchNotes = useClientStore(s => s.fetchNotes);
  const addNote = useClientStore(s => s.addNote);
  const updateNote = useClientStore(s => s.updateNote);
  const deleteNote = useClientStore(s => s.deleteNote);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchNotes(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleAdd(data: { method: NoteMethod; content: string }) {
    setSaving(true);
    try {
      await addNote(clientId, data);
      logOptimisticActivity('client', clientId, 'note_added', 'Added a note');
      toast.success('Note added');
      setShowAdd(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: { method: NoteMethod; content: string }) {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateNote(clientId, editingId, data);
      logOptimisticActivity(
        'client',
        clientId,
        'note_updated',
        'Updated a note'
      );
      toast.success('Note updated');
      setEditingId(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(clientId, noteId);
      logOptimisticActivity(
        'client',
        clientId,
        'note_deleted',
        'Deleted a note'
      );
      toast.success('Note deleted');
      setDeleteConfirmId(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-4 py-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
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
            Add Note
          </Button>
        )}
      </div>

      {showAdd && (
        <NoteForm
          saving={saving}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {notesLoading && notes.length === 0 ? (
        <div className="py-8 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notes.length === 0 && !showAdd ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No notes yet. Log a call, email, or meeting.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(n => (
            <div key={n._id}>
              {editingId === n._id ? (
                <NoteForm
                  initial={{ method: n.method, content: n.content }}
                  saving={saving}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <NoteCard
                    note={n}
                    mutating={saving}
                    onEdit={() => {
                      setShowAdd(false);
                      setEditingId(n._id);
                    }}
                    onDelete={() => setDeleteConfirmId(n._id)}
                  />
                  {deleteConfirmId === n._id && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Delete this note?
                      </span>
                      <Button
                        variant="destructive"
                        size="xs"
                        className="h-6 gap-1 px-2 text-xs"
                        disabled={saving}
                        onClick={() => handleDelete(n._id)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-6 gap-1 px-2 text-xs"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
