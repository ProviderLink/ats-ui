import { useApplicationStore } from '@/store/slices/applications.store';
import type { Application } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';

/** Draft and save state for the active application's pipeline notes. */
export function usePipelineNotes(activeApp: Application | null) {
  const updateAppNotes = useApplicationStore(s => s.updateNotes);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  function seedFromSaved() {
    if (!notesText && activeApp?.notes) {
      setNotesText(activeApp.notes);
    }
  }

  async function saveNotes() {
    if (!activeApp) return;
    setSavingNotes(true);
    try {
      await updateAppNotes(activeApp._id, notesText);
      toast.success('Notes saved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingNotes(false);
    }
  }

  return { notesText, setNotesText, savingNotes, seedFromSaved, saveNotes };
}
