import { descriptionToHtml } from '@/lib/markdown';
import { useJobStore } from '@/store';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  countFilledFields,
  hasListContent,
  type JobFormState,
} from '../_utils/job-form';

/**
 * The unsubmitted AI brief is kept outside React state so it survives the
 * sheet unmounting (Radix removes sheet content when closed). It is cleared
 * only after a job is successfully created, or on a full page reload.
 */
let aiNotesCache = '';

export function clearAiNotesCache() {
  aiNotesCache = '';
}

interface ListSnapshot {
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  benefits: string[];
}

export function useJobAi(
  form: JobFormState,
  patch: (changes: Partial<JobFormState>) => void,
  isEdit: boolean
) {
  const generateDraft = useJobStore(s => s.generateDraft);
  const standardizeContent = useJobStore(s => s.standardizeContent);

  // Seeded from the module cache so an accidental close doesn't lose the
  // brief. Never applies to edit mode — the feature is create-only.
  const [aiNotes, setAiNotes] = useState(() => (isEdit ? '' : aiNotesCache));
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [aiFilled, setAiFilled] = useState<Record<string, boolean>>({});
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  /**
   * Edit mode only: the list values as they were before the last standardize
   * run, so the user can undo an AI rewrite in one click.
   */
  const [aiOriginal, setAiOriginal] = useState<ListSnapshot | null>(null);

  const aiCanGenerate = aiNotes.trim().length >= 10;
  const aiFilledCount = Object.values(aiFilled).filter(Boolean).length;
  const aiOverwriteCount = countFilledFields(form);
  const aiHasListContent = hasListContent(form);

  function updateAiNotes(value: string) {
    aiNotesCache = value;
    setAiNotes(value);
  }

  /** Drop the "AI" marker for a field as soon as the user touches it. */
  function clearAiFilled(key: string) {
    setAiFilled(prev => (prev[key] ? { ...prev, [key]: false } : prev));
  }

  async function applyAiDraft() {
    const result = await generateDraft({ notes: aiNotes.trim() });

    if (result.title) patch({ title: result.title });
    if (result.description) {
      patch({ description: descriptionToHtml(result.description) });
    }
    if (result.requirements.length) patch({ requirements: result.requirements });
    if (result.responsibilities.length) {
      patch({ responsibilities: result.responsibilities });
    }
    if (result.skills.length) patch({ skills: result.skills });
    if (result.benefits.length) patch({ benefits: result.benefits });

    setAiFilled({
      title: Boolean(result.title),
      description: Boolean(result.description),
      requirements: result.requirements.length > 0,
      responsibilities: result.responsibilities.length > 0,
      skills: result.skills.length > 0,
      benefits: result.benefits.length > 0,
    });
    setAiExpanded(false);
  }

  async function runAiGenerate() {
    setConfirmOverwrite(false);
    setAiGenerating(true);
    try {
      await applyAiDraft();
      toast.success('Draft applied — review and edit below');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to generate job draft');
    } finally {
      setAiGenerating(false);
    }
  }

  function handleGenerateClick() {
    if (!aiCanGenerate || aiGenerating) return;
    if (aiOverwriteCount > 0 && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    void runAiGenerate();
  }

  /**
   * Edit mode: send the list fields currently in the form to be tidied. The
   * job's title, description, enums, dates, salary, tags and client are never
   * sent and never change — only these four lists come back rewritten.
   */
  async function runStandardize() {
    setAiGenerating(true);
    try {
      const snapshot: ListSnapshot = {
        requirements: form.requirements.filter(Boolean),
        responsibilities: form.responsibilities.filter(Boolean),
        skills: [...form.skills],
        benefits: form.benefits.filter(Boolean),
      };

      const result = await standardizeContent(snapshot);

      setAiOriginal(snapshot);
      patch({
        requirements: result.requirements.length ? result.requirements : [''],
        responsibilities: result.responsibilities.length
          ? result.responsibilities
          : [''],
        skills: result.skills,
        benefits: result.benefits.length ? result.benefits : [''],
      });
      setAiFilled({
        requirements: result.requirements.length > 0,
        responsibilities: result.responsibilities.length > 0,
        skills: result.skills.length > 0,
        benefits: result.benefits.length > 0,
      });

      toast.success('Content tidied — review below, nothing is saved yet');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to improve job content');
    } finally {
      setAiGenerating(false);
    }
  }

  /** Undo the last standardize run and restore the pre-AI list values. */
  function revertStandardize() {
    if (!aiOriginal) return;
    patch({
      requirements: aiOriginal.requirements.length
        ? aiOriginal.requirements
        : [''],
      responsibilities: aiOriginal.responsibilities.length
        ? aiOriginal.responsibilities
        : [''],
      skills: aiOriginal.skills,
      benefits: aiOriginal.benefits.length ? aiOriginal.benefits : [''],
    });
    setAiFilled({});
    setAiOriginal(null);
    toast.success('Reverted to the original content');
  }

  return {
    aiNotes,
    updateAiNotes,
    aiGenerating,
    aiExpanded,
    toggleAiExpanded: () => setAiExpanded(v => !v),
    aiFilled,
    aiFilledCount,
    clearAiFilled,
    aiCanGenerate,
    aiOverwriteCount,
    aiHasListContent,
    aiOriginal,
    confirmOverwrite,
    cancelOverwrite: () => setConfirmOverwrite(false),
    handleGenerateClick,
    runAiGenerate,
    runStandardize,
    revertStandardize,
  };
}
