import { logOptimisticActivity } from '@/lib/activity';
import { useClientStore } from '@/store';
import type { Client, CreateClientDto } from '@/store/types';
import { toast } from 'sonner';
import {
  buildClientUpdatePayload,
  type ClientFormValues,
} from '../../_utils/client-form';

export function useSaveClient(
  client: Client | undefined,
  tagIds: string[],
  logoFile: File | null,
  onDone: () => void
) {
  const create = useClientStore(s => s.create);
  const update = useClientStore(s => s.update);
  const uploadLogo = useClientStore(s => s.uploadLogo);
  const addContact = useClientStore(s => s.addContact);

  return async function save(values: ClientFormValues) {
    try {
      if (client) {
        await update(client._id, {
          ...buildClientUpdatePayload(values),
          tags: tagIds,
        });
        if (logoFile) {
          await uploadLogo(client._id, logoFile);
          toast.success('Logo updated');
        }
        logOptimisticActivity(
          'client',
          client._id,
          'updated',
          `Updated client ${client.companyName}`
        );
        toast.success(`Client "${client.companyName}" updated`);
      } else {
        const {
          contactName,
          contactEmail,
          contactPhone,
          contactPosition,
          ...clientData
        } = values;
        const newClient = await create({
          ...clientData,
          tags: tagIds,
        } as CreateClientDto);
        if (logoFile) {
          await uploadLogo(newClient._id, logoFile);
          toast.success('Logo updated');
        }

        if (contactName?.trim() && contactEmail?.trim()) {
          await addContact(newClient._id, {
            name: contactName.trim(),
            email: contactEmail.trim(),
            phone: contactPhone?.trim() || undefined,
            position: contactPosition?.trim() || undefined,
            isPrimary: true,
          });
        }

        logOptimisticActivity(
          'client',
          newClient._id,
          'created',
          `Created client ${newClient.companyName}`
        );
        toast.success(`Client "${newClient.companyName}" created`);
      }
      onDone();
    } catch (e) {
      toast.error(
        (e as Error).message ||
          (client ? 'Failed to update client' : 'Failed to create client')
      );
    }
  };
}
