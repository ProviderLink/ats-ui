import { EMAIL_TEMPLATE_TYPE_LABELS } from '@/lib/email-templates';
import { useEmailTemplateStore } from '@/store';
import type { EmailTemplate } from '@/store/types';
import { useState } from 'react';
import { toast } from 'sonner';
import type { EmailTemplateInput } from '../_components/email-template-sheet';

const typeLabel = (type: string) => EMAIL_TEMPLATE_TYPE_LABELS[type] ?? type;

export function useEmailTemplateActions() {
  const create = useEmailTemplateStore(s => s.create);
  const update = useEmailTemplateStore(s => s.update);
  const setDefault = useEmailTemplateStore(s => s.setDefault);
  const remove = useEmailTemplateStore(s => s.remove);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  /** Resolves true when the template was deleted. */
  async function deleteTemplate(id: string): Promise<boolean> {
    setDeleting(true);
    try {
      await remove(id);
      toast.success('Email template deleted');
      return true;
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete template');
      return false;
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(tpl: EmailTemplate) {
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

  async function makeDefault(tpl: EmailTemplate) {
    setSettingDefaultId(tpl._id);
    try {
      await setDefault(tpl._id);
      toast.success(
        `"${tpl.name}" is now the default for ${typeLabel(tpl.type)} emails`
      );
    } catch (e) {
      toast.error((e as Error).message || 'Failed to set default');
    } finally {
      setSettingDefaultId(null);
    }
  }

  /** Rethrows after toasting so the sheet stays open on failure. */
  async function save(data: EmailTemplateInput, editing?: EmailTemplate) {
    try {
      if (editing) {
        await update(editing._id, data);
        toast.success(
          data.isDefault
            ? `Template updated and set as default for ${typeLabel(data.type)} emails`
            : 'Email template updated'
        );
      } else {
        await create(data);
        toast.success(
          data.isDefault
            ? `Template created and set as default for ${typeLabel(data.type)} emails`
            : 'Email template created'
        );
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save template');
      throw e;
    }
  }

  return {
    deleting,
    togglingId,
    settingDefaultId,
    deleteTemplate,
    toggleActive,
    makeDefault,
    save,
  };
}
