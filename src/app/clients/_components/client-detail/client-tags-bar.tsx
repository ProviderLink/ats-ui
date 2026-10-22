import { TagsSelector } from '@/components/tags-selector';
import { getTagIds } from '@/lib/tags';
import { useClientStore, useTagStore } from '@/store';
import type { Client } from '@/store/types';
import { useEffect } from 'react';

interface ClientTagsBarProps {
  client: Client;
  open: boolean;
}

export function ClientTagsBar({ client, open }: ClientTagsBarProps) {
  const allTags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const updateClient = useClientStore(s => s.update);

  useEffect(() => {
    if (open) void fetchTags();
  }, [open, fetchTags]);

  async function handleChange(tagIds: string[]) {
    try {
      await updateClient(client._id, { tags: tagIds });
    } catch {
      // toast handled by store
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <TagsSelector
        allTags={allTags}
        selectedIds={getTagIds(client.tags)}
        onChange={handleChange}
        compact
      />
    </div>
  );
}
