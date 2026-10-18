import type { Client } from '@/store';
import {
  useClientStore,
  usePipelineTemplateStore,
  useTagStore,
} from '@/store';
import { useEffect } from 'react';

/** Loads the clients and tags the form needs, and the pipeline templates. */
export function useJobSheetData(open: boolean, clientsProp?: Client[]) {
  const storeClients = useClientStore(s => s.items);
  const fetchClients = useClientStore(s => s.fetch);
  const tags = useTagStore(s => s.items);
  const fetchTags = useTagStore(s => s.fetch);
  const fetchPipelines = usePipelineTemplateStore(s => s.fetch);

  const clients = clientsProp ?? storeClients;

  useEffect(() => {
    if (open) {
      if (clients.length === 0) void fetchClients();
      void fetchTags();
      void fetchPipelines();
    }
    // Load once per open; the fetchers are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { clients, tags };
}
