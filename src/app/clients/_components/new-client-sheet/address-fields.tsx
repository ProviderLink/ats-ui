import { Input } from '@/components/ui/input';
import type { ClientFormValues } from '../../_utils/client-form';
import type { UseFormRegister } from 'react-hook-form';
import { FormField } from './form-field';

interface AddressFieldsProps {
  register: UseFormRegister<ClientFormValues>;
}

export function AddressFields({ register }: AddressFieldsProps) {
  return (
    <>
      <FormField label="Street">
        <Input placeholder="123 Main St" {...register('address.street')} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City">
          <Input placeholder="e.g. New York" {...register('address.city')} />
        </FormField>
        <FormField label="State">
          <Input placeholder="e.g. NY" {...register('address.state')} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Country">
          <Input placeholder="e.g. USA" {...register('address.country')} />
        </FormField>
        <FormField label="Postal Code">
          <Input
            placeholder="e.g. 10001"
            {...register('address.postalCode')}
          />
        </FormField>
      </div>
    </>
  );
}
