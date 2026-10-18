import { useTagStore } from '@/store';
import type { Tag } from '@/store/types';
import { toast } from 'sonner';

export function useTagActions(editingTag: Tag | undefined) {
  const create = useTagStore(s => s.create);
  const update = useTagStore(s => s.update);
  const remove = useTagStore(s => s.remove);

  async function deleteTag(id: string) {
    try {
      await remove(id);
      toast.success('Tag deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete tag');
    }
  }

  async function saveTag(name: string, color: string) {
    try {
      if (editingTag) {
        await update(editingTag._id, { name, color });
        toast.success('Tag updated');
      } else {
        await create({ name, color });
        toast.success('Tag created');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save tag');
    }
  }

  /** Resolves true when every tag was deleted. */
  async function deleteTags(ids: string[]) {
    try {
      await Promise.all(ids.map(id => remove(id)));
      toast.success(`${ids.length} tag${ids.length === 1 ? '' : 's'} deleted`);
      return true;
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete tags');
      return false;
    }
  }

  return { deleteTag, saveTag, deleteTags };
}
