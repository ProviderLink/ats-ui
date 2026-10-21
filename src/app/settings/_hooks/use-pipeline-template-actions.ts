import { usePipelineTemplateStore } from '@/store';
import type { PipelineTemplate } from '@/store/types';
import { toast } from 'sonner';
import type { PipelineTemplateFormData } from './use-pipeline-template-form';

export function usePipelineTemplateActions() {
  const create = usePipelineTemplateStore(s => s.create);
  const update = usePipelineTemplateStore(s => s.update);
  const setAsDefault = usePipelineTemplateStore(s => s.setAsDefault);
  const remove = usePipelineTemplateStore(s => s.remove);

  /** Resolves true when the template was deleted. */
  async function deleteTemplate(id: string): Promise<boolean> {
    try {
      await remove(id);
      toast.success('Pipeline template deleted');
      return true;
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
      return false;
    }
  }

  async function makeDefault(id: string) {
    try {
      await setAsDefault(id);
      toast.success('Default pipeline template set');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default template');
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await update(id, { isActive: !current });
      toast.success(`Template ${!current ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update template');
    }
  }

  /** Rethrows after toasting so the sheet stays open on failure. */
  async function save(
    data: PipelineTemplateFormData,
    editing?: PipelineTemplate
  ) {
    const stagesDto = data.stages.map(({ _id: _omit, ...s }) => s);
    try {
      if (editing) {
        await update(editing._id, { ...data, stages: stagesDto });
        toast.success('Pipeline template updated');
      } else {
        await create({ ...data, stages: stagesDto });
        toast.success('Pipeline template created');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
      throw e;
    }
  }

  return { deleteTemplate, makeDefault, toggleActive, save };
}
